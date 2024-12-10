<script lang="ts">
  import { enhance } from '$app/forms'
  import { PUBLIC_APPLICATION_NAME } from '$env/static/public'

  let { form } = $props()
</script>

<svelte:head>
  <title>Login - {PUBLIC_APPLICATION_NAME}</title>
</svelte:head>

<div class="flex justify-center items-center min-h-[80vh]">
  <div class="card p-8 max-w-lg w-full preset-filled-surface-100-900">
    {#if form?.error}
      <aside class="card preset-tonal-warning mb-8 p-2 md:p-4">
        <p>{form.error}</p>
      </aside>
    {/if}

    <header class="text-center mb-8">
      <h1 class="h1 mb-2">Welcome Back</h1>
      <p class="opacity-75">Sign in to continue to {PUBLIC_APPLICATION_NAME}</p>
    </header>

    <form method="POST" class="space-y-4" use:enhance>
      <label class="label">
        <span>Email</span>
        <input name="email" type="email" placeholder="you@example.com" class="input" required value={form?.email} />
      </label>

      <label class="label">
        <span>Password</span>
        <input name="password" type="password" placeholder="Enter your password" class="input" required />
      </label>

      <div class="flex justify-between items-center mt-8">
        <button type="submit" class="btn preset-filled-primary-500 w-full">
          <i class="fa-solid fa-right-to-bracket"></i>
          Login
        </button>
      </div>

      <div class="divider my-8"></div>

      <div class="flex flex-col gap-4">
        <a href="/auth/signup" class="btn preset-outlined-primary-500">
          <i class="fa-solid fa-user-plus"></i>
          Create Account
        </a>
      </div>
    </form>
  </div>
</div>
