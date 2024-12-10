import { RESEND_API_KEY, RESEND_RECIPIENT_EMAIL, RESEND_SENDER_EMAIL } from '$env/static/private'
import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { users, userSettings } from '$lib/db/schema.js'
import { fail } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'

export const actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const data = {
      email: formData.get('email') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      passwordConfirmation: formData.get('password-confirmation') as string,
    }

    if (data.password !== data.passwordConfirmation) {
      return fail(400, { email: data.email, username: data.username, error: 'Passwords must match' })
    }

    const userWithUsername = await db.query.users.findFirst({ where: eq(users.username, data.username) })
    if (userWithUsername != null) {
      return fail(400, { email: data.email, username: data.username, error: 'User with username already exists' })
    }

    const signUpData = await supabase.auth.signUp({ email: data.email, password: data.password })

    if (signUpData.error != null) {
      return fail(400, { email: data.email, username: data.username, error: signUpData.error.message })
    }

    if (signUpData.data.user != null) {
      try {
        const [createdUser] = await db
          .insert(users)
          .values({ authUserFk: signUpData.data.user.id, username: data.username })
          .returning()
        const [createdUserSettings] = await db
          .insert(userSettings)
          .values({ userFk: createdUser.id, authUserFk: signUpData.data.user.id })
          .returning()
        await db.update(users).set({ userSettingsFk: createdUserSettings.id }).where(eq(users.id, createdUser.id))
      } catch (exception) {
        return fail(400, { email: data.email, username: data.username, error: convertException(exception) })
      }

      if (RESEND_API_KEY && RESEND_RECIPIENT_EMAIL && RESEND_SENDER_EMAIL) {
        const resend = new Resend(RESEND_API_KEY)

        await resend.emails.send({
          from: RESEND_SENDER_EMAIL,
          to: [RESEND_RECIPIENT_EMAIL],
          subject: 'New user',
          html: `A new user just signed up: ${data.username} - ${data.email}`,
        })
      }

      return { email: data.email, username: data.username, success: true }
    }
  },
}
