<script lang="ts">
  import { page } from '$app/stores'
  import { AppBar } from '@skeletonlabs/skeleton-svelte'
</script>

<svelte:head>
  <title>Authentication Error - Crag Track</title>
</svelte:head>

<div class="flex justify-center items-center min-h-[60vh]">
  <div class="card p-8 max-w-md w-full preset-filled-surface-100-900">
    <header class="text-center mb-8">
      <div class="flex justify-center mb-4">
        <i class="fa-solid fa-circle-exclamation text-4xl text-error-500"></i>
      </div>
      <h1 class="h2 mb-2">Authentication Failed</h1>
      {#if $page.url.searchParams.get('message')}
        <p class="opacity-75">{$page.url.searchParams.get('message')}</p>
      {:else}
        <p class="opacity-75">An error occurred during authentication. Please try again.</p>
      {/if}
    </header>

    <div class="flex flex-col gap-4">
      <a href="/auth" class="btn preset-filled-primary-500">
        <i class="fa-solid fa-arrow-left"></i>
        Back to Login
      </a>
    </div>
  </div>
</div>
