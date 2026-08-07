<template>
  <a
    :href="configurationUrl"
    download
    class="inline-block rounded bg-gray-100 p-2 align-middle transition hover:bg-red-800 hover:text-white dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-red-800 dark:hover:text-white"
    :title="
      cnDirectExport
        ? '下载国内直连配置（仅 IPv4；不含 DNS）'
        : $t('client.downloadConfig')
    "
  >
    <IconsDownload class="w-5" />
  </a>
</template>

<script setup lang="ts">
const props = defineProps<{
  client: LocalClient;
}>();

const cnDirectExport = useCnDirectExport();
const configurationUrl = computed(
  () =>
    `/api/client/${props.client.id}/configuration${
      cnDirectExport.value ? '?mode=cn-direct' : ''
    }`
);
</script>
