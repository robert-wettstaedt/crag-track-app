<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte'
</script>

<svelte:head>
  <title>Login - Crag Track</title>
</svelte:head>

<div class="flex justify-center items-center min-h-[80vh]">
  <div class="card p-8 max-w-md w-full preset-filled-surface-100-900">
    <header class="text-center mb-8">
      <h1 class="h1 mb-2">Welcome Back</h1>
      <p class="opacity-75">Sign in to continue to Crag Track</p>
    </header>

    <form method="POST" action="?/login" class="space-y-4">
      <label class="label">
        <span>Email</span>
        <input name="email" type="email" placeholder="you@example.com" class="input" required />
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
        <button formaction="?/signup" class="btn preset-outlined-primary-500">
          <i class="fa-solid fa-user-plus"></i>
          Create Account
        </button>
      </div>
    </form>
  </div>
</div>
