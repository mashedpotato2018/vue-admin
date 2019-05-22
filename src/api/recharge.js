import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/recharge/list',
    method: 'get',
    params: query
  })
}
