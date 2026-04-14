import type { AccountData } from '../../model/types.js'
import { fakeIdGenerator, flattenAccountRecords, formatDate, timezoneFromUid } from './utils.js'

export const exportUigf30 = (account: AccountData) => {
  const fakeId = fakeIdGenerator()
  const list = flattenAccountRecords(account)
    .map(({ uigf_gacha_type, rec }) => ({
      uigf_gacha_type,
      gacha_type: rec[4] || uigf_gacha_type,
      item_id: '',
      time: rec[0],
      name: rec[1],
      item_type: rec[2],
      rank_type: `${rec[3]}`,
      id: rec[5] || fakeId()
    }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  return {
    info: {
      uid: account.uid,
      lang: account.lang,
      export_time: formatDate(new Date()),
      export_timestamp: Math.round(Date.now() / 1000),
      export_app: 'genshin-wish-cli',
      export_app_version: 'v0.1.0',
      uigf_version: 'v3.0',
      region_time_zone: timezoneFromUid(account.uid)
    },
    list
  }
}

export const exportUigf41 = (accounts: AccountData[]) => {
  const hk4e = accounts.map((acc) => {
    const fakeId = fakeIdGenerator()
    const list = flattenAccountRecords(acc)
      .map(({ uigf_gacha_type, rec }) => ({
        uigf_gacha_type,
        gacha_type: rec[4] || uigf_gacha_type,
        item_id: '',
        time: rec[0],
        name: rec[1],
        item_type: rec[2],
        rank_type: `${rec[3]}`,
        id: rec[5] || fakeId()
      }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

    return {
      uid: acc.uid,
      timezone: timezoneFromUid(acc.uid),
      lang: acc.lang,
      list
    }
  })

  return {
    info: {
      export_timestamp: Math.round(Date.now() / 1000),
      export_app: 'genshin-wish-cli',
      export_app_version: 'v0.1.0',
      version: 'v4.1'
    },
    hk4e
  }
}
