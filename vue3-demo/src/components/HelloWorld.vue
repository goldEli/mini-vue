<script setup lang="ts">
console.log("Hello world! setup");
import { ref } from "vue";
import Child from "./Child.vue";

defineProps<{ msg: string }>();

const count = ref(0)

</script>

<template>
  <h1>{{ msg }}</h1>

  <button @click="count++">click</button>
  <div>{{ count }}</div>
  <Child :count="count"/>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
