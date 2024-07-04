<template>
  <basic-drawer showFooter v-bind="$attrs" width="60%" title="扫码支付配置" :visible="visible" :maskClosable="false" @close="handleCancel">
    <a-spin :spinning="confirmLoading">
      <a-form
        class="small-from-item"
        ref="formRef"
        :model="form"
        :rules="rules"
        :validate-trigger="['blur', 'change']"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
      >
        <a-form-item label="主键" name="id" :hidden="true">
          <a-input v-model:value="form.id" />
        </a-form-item>
        <a-form-item label="AppId" name="appId">
          <a-input v-model:value="form.appId" placeholder="请输入支付宝商户AppId" />
        </a-form-item>
        <a-form-item label="AppKey" name="appKey">
          <a-input v-model:value="form.appKey" placeholder="请输入AppKey" />
        </a-form-item>
        <a-form-item label="是否启用" name="enable">
          <a-switch checked-children="启用" un-checked-children="停用" v-model:checked="form.enable" />
        </a-form-item>
        <a-form-item name="limitAmount">
          <template #label>
            <basic-title helpMessage="每次发起支付的金额不能超过该值，如果同时配置了全局支付限额，则以额度低的为准">
              支付限额(元)
            </basic-title>
          </template>
          <a-input-number :precision="2" :min="0.01" v-model:value="form.limitAmount" placeholder="请输入支付限额(元)" />
        </a-form-item>
        <a-form-item name="alipayUserId">
          <template #label>
            <basic-title
              helpMessage="是商家与支付宝签约后，商家获得的支付宝商家唯一识别码，以 2088 开头的 16 位数字组成，在开放平台中账户中心获取"
              >合作者身份ID
            </basic-title>
          </template>
          <a-input v-model:value="form.alipayUserId" placeholder="请输入合作者身份ID" />
        </a-form-item>
        <a-form-item name="wxRedirectUrl">
          <template #label>
            <basic-title
              helpMessage="不填写时默认使用平台配置中的系统地址，受到支付宝授权回调地址只可以配置一个个的限制，我们有时需要通过代理转发来绕过这个限制，
                  此时回调地址就会与系统地址不一致"
            >
              授权回调地址
            </basic-title>
          </template>
          <a-input placeholder="请输入支付宝授权回调地址" v-model:value="form.redirectUrl" />
        </a-form-item>
        <a-form-item name="notifyUrl">
          <template #label>
            <basic-title helpMessage="为本网关接收支付宝相关的异步回调数据的地址, 而不是业务系统所需的地址"> 异步通知地址 </basic-title>
          </template>
          <a-input v-model:value="form.notifyUrl" placeholder="请输入异步通知地址" style="width: calc(100% - 80px)" />
          <a-button class="w-80px" type="primary" @click="genNotifyUrl">自动生成</a-button>
        </a-form-item>
        <a-form-item name="returnUrl">
          <template #label>
            <basic-title helpMessage="此处为本网关接收支付宝同步跳转通知的地址, 而不是业务系统所需的地址"> 同步通知地址 </basic-title>
          </template>
          <a-input v-model:value="form.returnUrl" placeholder="请输入同步通知地址" style="width: calc(100% - 80px)" />
          <a-button class="w-80px" type="primary" @click="genReturnUrl">自动生成</a-button>
        </a-form-item>
        <a-form-item label="支付网关U地址" name="serverUrl">
          <a-input v-model:value="form.serverUrl" placeholder="请输入支付网关地址" />
        </a-form-item>
        <a-form-item label="签名类型" name="signType">
          <a-select allowClear v-model:value="form.signType" style="width: 100%" placeholder="选择签名类型">
            <a-select-option key="MD5">MD5</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button key="cancel" @click="handleCancel">取消</a-button>
        <a-button v-if="!showable" key="forward" :loading="confirmLoading" type="primary" @click="handleOk">保存</a-button>
      </a-space>
    </template>
  </basic-drawer>
</template>

<script lang="ts" setup>
  import { computed, nextTick } from 'vue'
  import { $ref } from 'vue/macros'
  import useFormEdit from '/@/hooks/bootx/useFormEdit'
  import { update, VmqPayConfig, getConfig, generateNotifyUrl, generateReturnUrl } from './VmqPayConfig.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { BasicDrawer } from '/@/components/Drawer'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { useMessage } from '/@/hooks/web/useMessage'
  import Icon from '/@/components/Icon/src/Icon.vue'
  import BasicTitle from '/@/components/Basic/src/BasicTitle.vue'
  const { handleCancel, diffForm, labelCol, wrapperCol, confirmLoading, visible, showable } = useFormEdit()

  const { createMessage } = useMessage()

  const formRef = $ref<FormInstance>()

  let form = $ref({
    appId: '',
    appKey: '',
    enable: false,
    limitAmount: 20000,
    notifyUrl: '',
    returnUrl: '',
    serverUrl: '',
    signType: 'MD5',
    remark: '',
  } as VmqPayConfig)
  let rawForm: any
  // 校验
  const rules = computed(() => {
    return {
      appId: [{ required: true, message: '请输入AppId' }],
      appKey: [{ required: true, message: '请输入AppKey' }],
      enable: [{ required: true, message: '请选择是否启用' }],
      limitAmount: [{ required: true, message: '请输入单次支付限额' }],
      notifyUrl: [{ required: true, message: '请输入异步通知页面地址' }],
      returnUrl: [{ required: true, message: '请输入同步通知页面地址' }],
      serverUrl: [{ required: true, message: '请输入请求网关地址' }],
      signType: [{ required: true, message: '请选择加密类型' }],
      expireTime: [{ required: true, message: '请输入默认超时配置' }],
    } as Record<string, Rule[]>
  })
  // 事件
  const emits = defineEmits(['ok'])
  /**
   * 入口
   */
  function init() {
    visible.value = true
    resetForm()
    getInfo()
  }
  /**
   * 获取信息
   */
  function getInfo() {
    confirmLoading.value = true
    getConfig().then(({ data }) => {
      rawForm = { ...data }
      // 分转元
      if (data.limitAmount) {
        data.limitAmount = data.limitAmount / 100
      }
      form = data
      confirmLoading.value = false
    })
  }
  /**
   * 更新
   */
  function handleOk() {
    formRef?.validate().then(async () => {
      confirmLoading.value = true
      const updateFrom = { ...form }
      // 元转分
      console.log(updateFrom.limitAmount)
      if (updateFrom.limitAmount) {
        updateFrom.limitAmount = updateFrom.limitAmount * 100
      }
      console.log(updateFrom.limitAmount)
      await update({
        ...updateFrom,
        ...diffForm(rawForm, form, 'appId', 'appKey'),
      })
      confirmLoading.value = false
      createMessage.success('保存成功')
      handleCancel()
      emits('ok')
    })
  }

  /**
   * 生成异步通知地址
   */
  function genNotifyUrl() {
    generateNotifyUrl().then(({ data }) => {
      form.notifyUrl = data
      formRef?.validateFields(['notifyUrl'])
    })
  }

  /**
   * 生成同步通知地址
   */
  function genReturnUrl() {
    generateReturnUrl().then(({ data }) => {
      form.returnUrl = data
      formRef?.validateFields(['returnUrl'])
    })
  }

  /**
   * 重置表单
   */
  function resetForm() {
    nextTick(() => {
      formRef?.resetFields()
    })
  }
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
