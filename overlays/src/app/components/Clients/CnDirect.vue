<template>
  <div
    class="flex items-center gap-2 rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-neutral-600 dark:text-neutral-200"
    title="开启后，下载的配置会让中国大陆 IPv4 使用手机自身网络，国外 IPv4 和家里局域网通过 WireGuard。此配置过大，不能使用二维码。"
  >
    <span class="whitespace-nowrap">国内直连配置</span>
    <BaseSwitch id="cn-direct-export" v-model="enabled" />
  </div>
</template>

<script setup lang="ts">
const enabled = useCnDirectExport();

onMounted(() => {
  enabled.value = localStorage.getItem('wg-easy-cn-direct-export') === '1';

  watch(enabled, (value) => {
    localStorage.setItem('wg-easy-cn-direct-export', value ? '1' : '0');
  });
});
</script>
