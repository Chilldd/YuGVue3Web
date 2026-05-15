<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NSwitch, NSpace, NButton } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import type { ResourceListItem, CreateResourceCommand } from '@/api/resources'
import { useResource } from '@/composables/useResource'

const { getDetail, save: saveResource } = useResource()

const props = withDefaults(defineProps<{
  visible: boolean
  isEdit?: boolean
  editingId?: string | null
  parentResources?: ResourceListItem[]
  initialParentId?: string | null
}>(), {
  isEdit: false,
  editingId: null,
  parentResources: () => [],
  initialParentId: null,
})

const emit = defineEmits<{
  'update:visible': [v: boolean]
  saved: []
}>()

const submitting = ref(false)
const formRef = ref<FormInst | null>(null)

const formDefault = (): CreateResourceCommand => ({
  name: '',
  code: '',
  description: '',
  type: 'Menu',
  httpMethod: undefined,
  path: '',
  icon: '',
  route: '',
  isHidden: false,
  badge: '',
  permissionCode: '',
  parentId: null,
  sortOrder: 0,
  status: 'Active',
})
const form = reactive<CreateResourceCommand>(formDefault())

const isMenu = computed(() => form.type === 'Menu')
const isPage = computed(() => form.type === 'Page')
const isApi = computed(() => form.type === 'Api')
const isUiType = computed(() => isMenu.value || isPage.value)

const typeOptions = [
  { label: 'Menu', value: 'Menu' },
  { label: 'Page', value: 'Page' },
  { label: 'Api', value: 'Api' },
]
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
]
const statusOptions = [
  { label: '启用', value: 'Active' },
  { label: '禁用', value: 'Disabled' },
]

/** Allowed parent types based on current resource type */
const allowedParentTypes = computed(() => {
  switch (form.type) {
    case 'Menu': return ['Menu']
    case 'Page': return ['Menu']
    case 'Api': return ['Page']
    default: return []
  }
})

const parentOptions = computed(() => {
  const items = props.parentResources
    .filter((item) => item.id !== props.editingId)
    .filter((item) => allowedParentTypes.value.includes(item.type || ''))
    .map((item) => ({
      label: item.name || item.code || `#${item.id}`,
      value: item.id,
    }))
  return [{ label: '（无）', value: null as unknown as string }, ...items]
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入资源名称', trigger: 'blur' },
    { max: 200, message: '名称最长 200 字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入资源编码', trigger: 'blur' },
    { max: 100, message: '编码最长 100 字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '仅支持字母、数字、_、-', trigger: 'blur' },
  ],
  type: { required: true, message: '请选择资源类型', trigger: 'change' },
}

function resetForm() {
  Object.assign(form, formDefault())
}

async function loadDetail(id: string) {
  const detail = await getDetail(id)
  if (!detail) return
  form.name = detail.name ?? ''
  form.code = detail.code ?? ''
  form.description = detail.description ?? ''
  form.type = detail.type ?? 'Menu'
  form.httpMethod = detail.httpMethod ?? undefined
  form.path = detail.path ?? ''
  form.icon = detail.icon ?? ''
  form.route = detail.route ?? ''
  form.isHidden = detail.isHidden ?? false
  form.badge = detail.badge ?? ''
  form.permissionCode = detail.permissionCode ?? ''
  form.parentId = detail.parentId
  form.sortOrder = detail.sortOrder ?? 0
  form.status = detail.status ?? 'Active'
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    // dynamic validation for Api-specific required fields
    if (form.type === 'Api') {
      if (!form.httpMethod) throw new Error('请选择 HTTP 方法')
      if (!form.path) throw new Error('请输入 API 路径')
      if (!form.permissionCode) throw new Error('请输入权限编码')
    }
  } catch {
    return
  }

  submitting.value = true
  try {
    const payload = { ...form }

    // Clean fields by type
    if (form.type === 'Menu') {
      delete payload.httpMethod
      delete payload.path
      delete payload.permissionCode
    } else if (form.type === 'Page') {
      delete payload.httpMethod
      delete payload.path
      delete payload.icon
      delete payload.badge
      delete payload.isHidden
      if (!payload.permissionCode) delete payload.permissionCode
    } else if (form.type === 'Api') {
      delete payload.icon
      delete payload.route
      delete payload.badge
      delete payload.isHidden
    }

    // Common cleanup
    if (!payload.description) delete payload.description
    if (!payload.parentId) payload.parentId = null

    const ok = await saveResource(payload, props.isEdit ? props.editingId : null)
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
      if (props.initialParentId) {
        form.parentId = props.initialParentId
      }
    }
  }
})
</script>

<template>
  <n-modal
    :show="visible"
    :mask-closable="false"
    preset="card"
    :title="isEdit ? '编辑资源' : '新建资源'"
    :bordered="false"
    :segmented="{ content: true, footer: true }"
    style="width:60vw;max-width:90vw"
    @update:show="handleClose"
  >
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" label-width="auto">
      <!-- Common fields -->
      <div class="resource-form__section">
        <h3 class="resource-form__section-title">基本信息</h3>
        <div class="resource-form__grid">
          <n-form-item label="名称" path="name">
            <n-input v-model:value="form.name" placeholder="资源显示名称" :maxlength="200" />
          </n-form-item>
          <n-form-item label="编码" path="code">
            <n-input v-model:value="form.code" placeholder="唯一编码，如 system-resources" :maxlength="100" />
          </n-form-item>
          <n-form-item label="类型" path="type">
            <n-select v-model:value="form.type" :options="typeOptions" />
          </n-form-item>
          <n-form-item label="状态">
            <n-select v-model:value="form.status" :options="statusOptions" />
          </n-form-item>
          <n-form-item label="排序号">
            <n-input-number v-model:value="form.sortOrder" :min="0" :max="9999" placeholder="0" class="resource-form__full" />
          </n-form-item>
          <n-form-item label="父级资源">
            <n-select
              v-model:value="form.parentId"
              :options="parentOptions"
              placeholder="（无）"
              clearable
              :disabled="allowedParentTypes.length === 0"
            />
          </n-form-item>
          <n-form-item label="描述" class="resource-form__span2">
            <n-input v-model:value="form.description" placeholder="资源描述（可选）" :maxlength="500" type="textarea" :rows="2" />
          </n-form-item>
        </div>
      </div>

      <!-- Menu type fields -->
      <div v-if="isMenu" class="resource-form__section">
        <h3 class="resource-form__section-title">菜单配置</h3>
        <div class="resource-form__grid">
          <n-form-item label="图标">
            <n-input v-model:value="form.icon" placeholder="图标名称" :maxlength="100" />
          </n-form-item>
          <n-form-item label="路由">
            <n-input v-model:value="form.route" placeholder="/path/to/page" :maxlength="500" />
          </n-form-item>
          <n-form-item label="角标">
            <n-input v-model:value="form.badge" placeholder="菜单角标文本" :maxlength="50" />
          </n-form-item>
          <n-form-item label=" " class="resource-form__span2">
            <n-space align="center">
              <n-switch v-model:value="form.isHidden" />
              <span class="resource-form__hint">隐藏菜单</span>
            </n-space>
          </n-form-item>
        </div>
      </div>

      <!-- Page type fields -->
      <div v-if="isPage" class="resource-form__section">
        <h3 class="resource-form__section-title">页面配置</h3>
        <div class="resource-form__grid">
          <n-form-item label="路由">
            <n-input v-model:value="form.route" placeholder="/path/to/page" :maxlength="500" />
          </n-form-item>
          <n-form-item label="权限编码" class="resource-form__span2">
            <n-input v-model:value="form.permissionCode" placeholder="permission:code" :maxlength="100" />
            <template #feedback>
              <span class="resource-form__hint">如不需要权限请留空，会存为 null；不要传空字符串</span>
            </template>
          </n-form-item>
        </div>
      </div>

      <!-- Api type fields -->
      <div v-if="isApi" class="resource-form__section">
        <h3 class="resource-form__section-title">API 配置</h3>
        <div class="resource-form__grid">
          <n-form-item label="HTTP 方法" path="httpMethod">
            <n-select v-model:value="form.httpMethod" :options="methodOptions" placeholder="请选择" />
          </n-form-item>
          <n-form-item label="API 路径" path="path">
            <n-input v-model:value="form.path" placeholder="/api/example" :maxlength="500" />
          </n-form-item>
          <n-form-item label="权限编码" class="resource-form__span2">
            <n-input v-model:value="form.permissionCode" placeholder="格式：{模块}:{操作}，如 user:create" :maxlength="100" />
            <template #feedback>
              <span class="resource-form__hint">必须填写，格式为 {模块}:{操作}</span>
            </template>
          </n-form-item>
        </div>
      </div>
    </n-form>

    <template #footer>
      <div class="resource-form__footer">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '创建' }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.resource-form__section {
  margin-bottom: 20px;
}
.resource-form__section:last-child {
  margin-bottom: 0;
}
.resource-form__section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-quaternary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.resource-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
.resource-form__span2 {
  grid-column: span 2;
}
.resource-form__full {
  width: 100%;
}
.resource-form__hint {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.4;
}
.resource-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
@media (max-width: 768px) {
  .resource-form__grid {
    grid-template-columns: 1fr;
  }
  .resource-form__span2 {
    grid-column: span 1;
  }
}
</style>
