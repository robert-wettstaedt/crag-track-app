<script lang="ts">
  import { enhance } from '$app/forms'

  let { form } = $props()
</script>

<svelte:head>
  <title>Signup - Crag Track</title>
</svelte:head>

<div class="flex justify-center items-center min-h-[80vh]">
  <div class="card p-8 max-w-lg w-full preset-filled-surface-100-900">
    {#if form?.error}
      <aside class="card preset-tonal-warning mb-8 p-2 md:p-4">
        <p>{form.error}</p>
      </aside>
    {/if}

    {#if form?.success}
      <header class="text-center mb-8">
        <h1 class="h1 mb-2">Success</h1>
        <p class="opacity-75">
          We have sent a confirmation to your email address {form.email}. Please verify your email before signin in.
        </p>
      </header>
    {:else}
      <header class="text-center mb-8">
        <h1 class="h1 mb-2">Create account</h1>
        <p class="opacity-75">Sign up to continue to Crag Track</p>
      </header>

      <form method="POST" class="space-y-4" use:enhance>
        <label class="label">
          <span>Email</span>
          <input name="email" type="email" placeholder="you@example.com" class="input" required value={form?.email} />
        </label>

        <label class="label">
          <span>Username</span>
          <input
            name="username"
            type="text"
            class="input"
            placeholder="Enter your username"
            required
            value={form?.username}
          />
        </label>

        <label class="label">
          <span>Password</span>
          <input name="password" type="password" placeholder="Enter your password" class="input" required />
        </label>

        <label class="label">
          <span>Password confirmation</span>
          <input
            name="password-confirmation"
            type="password"
            placeholder="Enter your password"
            class="input"
            required
          />
        </label>

        <div class="flex justify-between items-center mt-8">
          <button type="submit" class="btn preset-filled-primary-500 w-full">
            <i class="fa-solid fa-right-to-bracket"></i>
            Sign up
          </button>
        </div>

        <div class="divider my-8"></div>

        <div class="flex flex-col gap-4">
          <a href="/auth/signin" class="btn preset-outlined-primary-500">
            <i class="fa-solid fa-user"></i>
            Log into existing account
          </a>
        </div>
      </form>
    {/if}
  </div>
</div>
