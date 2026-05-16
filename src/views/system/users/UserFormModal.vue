<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import type { CreateUserCommand } from '@/api/system/user'
import { useUser } from '@/composables/useUser'

const { save } = useUser()

const props = withDefaults(defineProps<{
  visible: boolean
}>(), {
  visible: false,
})

const emit = defineEmits<{
  'update:visible': [v: boolean]
  saved: []
}>()

const submitting = ref(false)
const formRef = ref<FormInst | null>(null)

const formDefault = (): CreateUserCommand => ({
  username: '',
  password: '',
})

const form = reactive<CreateUserCommand>(formDefault())

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' },
  ],
}

function resetForm() {
  Object.assign(form, formDefault())
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const ok = await save(form)
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
    resetForm()
  }
})
</script>

<template>
  <n-modal
    :show="visible"
    :mask-closable="false"
    preset="card"
    title="新建用户"
    :bordered="false"
    :segmented="{ content: true, footer: true }"
    style="width:480px"
    @update:show="handleClose"
  >
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" label-width="auto">
      <n-form-item label="用户名" path="username">
        <n-input v-model:value="form.username" placeholder="字母、数字和下划线" />
      </n-form-item>
      <n-form-item label="密码" path="password">
        <n-input v-model:value="form.password" type="password" placeholder="至少 6 位" show-password-on="click" />
      </n-form-item>
    </n-form>

    <template #footer>
      <div class="user-form__footer">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="handleSubmit">
          创建
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.user-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
