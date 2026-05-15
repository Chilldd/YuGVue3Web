<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NButton } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import type { CreateRoleCommand } from '@/api/role'
import { useRole } from '@/composables/useRole'

const { getDetail, save: saveRole } = useRole()

const props = withDefaults(defineProps<{
  visible: boolean
  isEdit?: boolean
  editingId?: string | null
}>(), {
  isEdit: false,
  editingId: null,
})

const emit = defineEmits<{
  'update:visible': [v: boolean]
  saved: []
}>()

const submitting = ref(false)
const formRef = ref<FormInst | null>(null)

const formDefault = (): CreateRoleCommand => ({
  name: '',
  code: '',
  description: '',
})

const form = reactive<CreateRoleCommand>(formDefault())

const statusOptions = [
  { label: '启用', value: 'Active' },
  { label: '禁用', value: 'Disabled' },
]
const roleStatus = ref('Active')

const rules: FormRules = {
  name: { required: true, message: '请输入角色名称', trigger: 'blur' },
  code: { required: true, message: '请输入角色编码', trigger: 'blur' },
}

function resetForm() {
  Object.assign(form, formDefault())
  roleStatus.value = 'Active'
}

async function loadDetail(id: string) {
  const detail = await getDetail(id)
  if (!detail) return
  form.name = detail.name ?? ''
  form.code = detail.code ?? ''
  form.description = detail.description ?? ''
  roleStatus.value = detail.status ?? 'Active'
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const ok = await saveRole(form, props.isEdit ? props.editingId : null)
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

watch(() => props.visible, (v) => {
  if (v) {
    if (props.isEdit && props.editingId) {
      loadDetail(props.editingId)
    } else {
      resetForm()
    }
  }
})
</script>

<template>
  <n-modal
    :show="visible"
    :mask-closable="false"
    preset="card"
    :title="isEdit ? '编辑角色' : '新建角色'"
    :bordered="false"
    :segmented="{ content: true, footer: true }"
    style="width:520px"
    @update:show="handleClose"
  >
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" label-width="auto">
      <n-form-item label="名称" path="name">
        <n-input v-model:value="form.name" placeholder="角色显示名称" />
      </n-form-item>
      <n-form-item label="编码" path="code">
        <n-input v-model:value="form.code" placeholder="唯一编码，如 admin" />
      </n-form-item>
      <n-form-item v-if="isEdit" label="状态">
        <n-select v-model:value="roleStatus" :options="statusOptions" disabled />
      </n-form-item>
      <n-form-item label="描述">
        <n-input
          v-model:value="form.description"
          type="textarea"
          :rows="3"
          placeholder="角色描述"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <div class="role-form__footer">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '创建' }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.role-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
