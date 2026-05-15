<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { NModal, NTransfer, NButton, NSpin, NEmpty } from 'naive-ui'
import type { RoleListItem } from '@/api/role'
import { getRoleList } from '@/api/role'
import { useUser } from '@/composables/useUser'

const { getDetail, saveRoles } = useUser()

const props = withDefaults(defineProps<{
  visible: boolean
  userId?: number | null
  username?: string
}>(), {
  userId: null,
  username: '',
})

const emit = defineEmits<{
  'update:visible': [v: boolean]
  saved: []
}>()

const submitting = ref(false)
const loading = ref(false)
const roleOptions = ref<{ label: string; value: number }[]>([])
const selectedRoleIds = ref<number[]>([])

async function loadRoles() {
  try {
    const res = await getRoleList()
    roleOptions.value = (res.items || []).map((r: RoleListItem) => ({
      label: r.name || r.code || `#${r.id}`,
      value: r.id,
    }))
  } catch {
    roleOptions.value = []
  }
}

async function loadUserRoles(userId: number) {
  loading.value = true
  try {
    const detail = await getDetail(userId)
    if (detail?.roleIds) {
      selectedRoleIds.value = detail.roleIds
    }
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!props.userId) return
  submitting.value = true
  try {
    const ok = await saveRoles({ userId: props.userId, roleIds: selectedRoleIds.value })
    if (ok) {
      emit('update:visible', false)
      emit('saved')
    }
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}

onMounted(() => {
  loadRoles()
})

watch(() => props.visible, (v) => {
  if (v && props.userId) {
    selectedRoleIds.value = []
    loadUserRoles(props.userId)
  }
})
</script>

<template>
  <n-modal
    :show="visible"
    :mask-closable="false"
    preset="card"
    title="分配角色"
    :bordered="false"
    :segmented="{ content: true, footer: true }"
    style="width:540px"
    @update:show="handleClose"
  >
    <p class="user-role__hint">
      为用户「{{ username }}」分配角色，已选 {{ selectedRoleIds.length }} 项
    </p>

    <n-spin :show="loading">
      <n-empty v-if="!loading && roleOptions.length === 0" description="暂无角色" />
      <n-transfer
        v-else
        v-model:value="selectedRoleIds"
        :options="roleOptions"
        source-title="可选角色"
        target-title="已选角色"
        size="small"
      />
    </n-spin>

    <template #footer>
      <div class="user-role__footer">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="handleSubmit">
          保存分配
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.user-role__hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 16px;
}
.user-role__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
