import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)
    if (error == null) {
      redirect(303, '/')
    }

    return fail(400, { ...data, error: error.message })
  },
}
