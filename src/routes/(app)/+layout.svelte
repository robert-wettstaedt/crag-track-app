<script lang="ts">
  import Layout from '$lib/components/Layout'
  import '@fortawesome/fontawesome-free/css/all.css'
  import '../../app.postcss'

  let { data, form, children } = $props()
</script>

<Layout {data} {form} {children} />
