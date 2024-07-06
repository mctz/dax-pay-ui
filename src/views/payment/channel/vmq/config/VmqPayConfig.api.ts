import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity, KeyValue } from '/#/web'

/**
 * 获取单条
 */
export function getConfig() {
  return defHttp.get<Result<VmqPayConfig>>({
    url: '/vmq/config/getConfig',
  })
}

/**
 * 更新
 */
export function update(obj: VmqPayConfig) {
  return defHttp.post({
    url: '/vmq/config/update',
    data: obj,
  })
}

/**
 * 生成异步通知地址
 */
export function generateNotifyUrl() {
  return defHttp.get<Result<string>>({
    url: '/vmq/config/generateNotifyUrl',
  })
}
/**
 * 生成同步通知地址
 */
export function generateReturnUrl() {
  return defHttp.get<Result<string>>({
    url: '/vmq/config/generateReturnUrl',
  })
}

/**
 * 支付宝配置
 */
export interface VmqPayConfig extends BaseEntity {
  // 支付宝商户appId
  appId?: string
  appKey?: string
  // 是否启用
  enable: boolean
  email?: string
  // 支付限额
  limitAmount?: number
  // 商户账号ID
  alipayUserId?: string
  // 授权回调地址
  redirectUrl?: string
  // 服务器异步通知页面路径
  notifyUrl?: string
  // 页面跳转同步通知页面路径
  returnUrl?: string
  // 请求网关地址
  serverUrl?: string
  // 签名类型
  signType?: string
  // 备注
  remark?: string
}
