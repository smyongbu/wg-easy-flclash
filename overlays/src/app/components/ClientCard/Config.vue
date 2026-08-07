<template>
  <span
    class="inline-flex items-center gap-2"
    role="group"
    aria-label="下载客户端配置"
  >
    <a
      :href="`/api/client/${client.id}/configuration`"
      download
      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-gray-100 p-2 text-gray-600 transition hover:bg-red-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-red-800 dark:hover:text-white dark:focus-visible:outline-red-300"
      :title="$t('client.downloadConfig')"
      :aria-label="$t('client.downloadConfig')"
    >
      <IconsDownload aria-hidden="true" class="w-5" />
    </a>

    <a
      :href="`/api/client/${client.id}/configuration?format=flclash`"
      download
      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-sky-100 p-2 text-xs font-bold text-sky-800 transition hover:bg-sky-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:bg-sky-950 dark:text-sky-200 dark:hover:bg-sky-700 dark:hover:text-white dark:focus-visible:outline-sky-300"
      title="下载 FlClash 分流配置（国内直连，国外经 WireGuard）"
      aria-label="下载 FlClash 分流配置"
    >
      <span aria-hidden="true">FC</span>
    </a>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  client: LocalClient;
}>();
</script>
