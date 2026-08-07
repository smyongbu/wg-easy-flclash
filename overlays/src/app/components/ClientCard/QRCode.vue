<template>
  <ClientsQRCodeDialog
    v-if="!cnDirectExport"
    :qr-code="`./api/client/${client.id}/qrcode.svg`"
  >
    <div
      class="rounded bg-gray-100 p-2 align-middle transition hover:bg-red-800 hover:text-white dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-red-800 dark:hover:text-white"
      :title="$t('client.showQR')"
    >
      <IconsQRCode class="w-5" />
    </div>
  </ClientsQRCodeDialog>
  <div
    v-else
    class="cursor-not-allowed rounded bg-gray-100 p-2 align-middle text-gray-300 opacity-60 dark:bg-neutral-600 dark:text-neutral-500"
    title="国内直连配置约 165 KB，二维码无法容纳，请使用旁边的下载按钮导入配置文件。"
  >
    <IconsQRCode class="w-5" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  client: LocalClient;
}>();

const cnDirectExport = useCnDirectExport();
</script>
