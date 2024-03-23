<script lang="ts">
  import { page } from '$app/stores'
  import { AppBar, popup } from '@skeletonlabs/skeleton'
  import { DateTime } from 'luxon'

  export let data
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <button class="btn" on:click={() => history.back()} type="button">
      <i class="fa-solid fa-arrow-left text-2xl" />
    </button>
  </svelte:fragment>

  Ascent of {data.boulder.name}

  <svelte:fragment slot="headline">
    <dl class="list-dl">
      <div>
        <span class="flex-auto">
          <dt>Ascentionist</dt>
          <dd>{data.author.firstName} {data.author.lastName}</dd>
        </span>
      </div>

      <div>
        <a href={`/boulders/${data.boulder.id}`}>
          <span class="flex-auto">
            <dt><i class="fa-solid fa-link me-2" />Boulder</dt>
            <dd>
              {data.boulder.name}
            </dd>
          </span>
        </a>
      </div>

      <div>
        <span class="flex-auto">
          <dt>Grade</dt>
          <dd>
            {#if data.boulder.grade == null}
              n/A
            {:else}
              {data.boulder.gradingScale} {data.boulder.grade}
            {/if}
          </dd>
        </span>
      </div>

      <div>
        <span class="flex-auto">
          <dt>Type</dt>
          <dd>
            {#if data.ascent.type === 'flash'}
              <i class="fa-solid fa-bolt-lightning text-yellow-300 me-2" />Flash
            {:else if data.ascent.type === 'send'}
              <i class="fa-solid fa-circle text-red-500 me-2" />Send
            {:else}
              <i class="fa-solid fa-person-falling text-blue-300 me-2" />Attempt
            {/if}
          </dd>
        </span>
      </div>

      <div>
        <span class="flex-auto">
          <dt>Date</dt>
          <dd>{DateTime.fromSQL(data.ascent.dateTime).toLocaleString(DateTime.DATE_FULL)}</dd>
        </span>
      </div>
    </dl>
  </svelte:fragment>

  <svelte:fragment slot="trail">
    <a
      class="btn btn-icon btn-icon-sm variant-ghost"
      href={`/ascents/${$page.params.ascentId}/edit`}
      use:popup={{
        event: 'hover',
        target: '/ascents/:ascentId-edit_ascent',
        placement: 'bottom-end',
      }}
    >
      <i class="fa-solid fa-pen" />
    </a>
  </svelte:fragment>

  <div class="card p-4 variant-filled-secondary" data-popup="/ascents/:ascentId-edit_ascent">
    <p>Edit ascent</p>
    <div class="arrow variant-filled-secondary" />
  </div>
</AppBar>
