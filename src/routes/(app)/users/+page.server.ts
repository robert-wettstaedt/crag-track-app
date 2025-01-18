import { RESEND_API_KEY, RESEND_RECIPIENT_EMAIL, RESEND_SENDER_EMAIL } from '$env/static/private'
import { PUBLIC_APPLICATION_NAME } from '$env/static/public'
import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient, db } from '$lib/db/db.server'
import { activities, userRoles, users, type User } from '$lib/db/schema'
import {
  addRoleActionSchema,
  validateFormData,
  validateObject,
  type ActionFailure,
  type AddRoleActionValues,
} from '$lib/forms.server'
import { getUser } from '$lib/helper.server'
import { getPaginationQuery, paginationParamsSchema } from '$lib/pagination.server'
import { error, fail } from '@sveltejs/kit'
import { asc, count, eq, inArray } from 'drizzle-orm'
import { authUsers } from 'drizzle-orm/supabase'
import { Resend } from 'resend'
import type { PageServerLoad } from './$types'

interface UserDTO extends User {
  role?: string
}

export const load = (async ({ locals, url }) => {
  const localDb = await createDrizzleSupabaseClient(locals.supabase)

  const searchParamsObj = Object.fromEntries(url.searchParams.entries())
  const searchParams = await validateObject(paginationParamsSchema, searchParamsObj)

  let usersResult: UserDTO[] = await localDb((tx) =>
    tx.query.users.findMany({ ...getPaginationQuery(searchParams), orderBy: asc(users.username) }),
  )

  if (locals.userPermissions?.includes(EDIT_PERMISSION)) {
    const userRolesResult = await db.query.userRoles.findMany({
      where: inArray(
        userRoles.authUserFk,
        usersResult.map((user) => user.authUserFk),
      ),
    })

    usersResult = usersResult.map((user) => ({
      ...user,
      role: userRolesResult.find((role) => role.authUserFk === user.authUserFk)?.role,
    }))
  }

  const countResults = await localDb((tx) => tx.select({ count: count() }).from(users))

  return {
    users: usersResult,
    pagination: {
      page: searchParams.page,
      pageSize: searchParams.pageSize,
      total: countResults[0].count,
    },
  }
}) satisfies PageServerLoad

export const actions = {
  addRole: async ({ locals, request, url }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const localDb = await createDrizzleSupabaseClient(locals.supabase)
    const user = await localDb((tx) => getUser(locals.user, tx))

    const data = await request.formData()

    let values: AddRoleActionValues

    try {
      values = await validateFormData(addRoleActionSchema, data)
    } catch (exception) {
      return exception as ActionFailure<AddRoleActionValues>
    }

    const formAuthUserResults = await db.select().from(authUsers).where(eq(authUsers.id, values.authUserFk))
    const formAuthUser = formAuthUserResults.at(0)
    const formUser = await db.query.users.findFirst({ where: eq(users.authUserFk, values.authUserFk) })

    if (formAuthUser == null || formUser == null) {
      return fail(404)
    }

    await db.insert(userRoles).values({ authUserFk: values.authUserFk, role: 'user' })
    await localDb(async (tx) =>
      user == null
        ? null
        : tx.insert(activities).values({
            type: 'updated',
            entityId: formUser.id,
            entityType: 'user',
            userFk: user.id,
            columnName: 'role',
            newValue: 'user',
          }),
    )

    if (RESEND_API_KEY && RESEND_RECIPIENT_EMAIL && RESEND_SENDER_EMAIL && formAuthUser.email != null) {
      const resend = new Resend(RESEND_API_KEY)

      await resend.emails.send({
        from: RESEND_SENDER_EMAIL,
        to: [formAuthUser.email],
        subject: `Your ${PUBLIC_APPLICATION_NAME} Account is Approved!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; margin-bottom: 24px;">Hello ${formUser.username}, your account is now active!</h1>

            <p style="color: #666; line-height: 1.6;">
              Great news! Your ${PUBLIC_APPLICATION_NAME} account has been approved and is ready to use. You can now:
            </p>

            <ul style="color: #666; line-height: 1.6;">
              <li>Document your ascents and track your progress</li>
              <li>Access detailed climbing topos</li>
              <li>Connect with the climbing community</li>
            </ul>

            <div style="margin: 32px 0;">
              <a href="${url.origin}/auth/signin" style="background-color: rgb(130, 58, 165); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Sign In Now
              </a>
            </div>

            <p style="color: #666; line-height: 1.6;">
              If you have any questions or need assistance, don't hesitate to reach out to our team.
            </p>

            <p style="color: #666; line-height: 1.6; margin-top: 24px;">
              Happy climbing!<br>
              The ${PUBLIC_APPLICATION_NAME} Team
            </p>
          </div>
        `,
      })
    }
  },
}
