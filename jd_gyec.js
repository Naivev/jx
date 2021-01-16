/*
 * @Author: shylocks https://github.com/shylocks
 * @Date: 2021-01-15 16:25:41
 * @Last Modified by:   shylocks
 * @Last Modified time: 2021-01-16 18:25:41
 */
/*
工业品爱消除
活动共200关，通关可获得3星，600星可兑换1888京豆，按照cron运行只需7天即可得到
感谢@yogayyy(https://github.com/yogayyy/Scripts)制作的图标
活动入口：京东app首页-京东工业品-京东工业品年末盛典-勇闯消消乐
已支持IOS双京东账号,Node.js支持N个京东账号
boxjs 填写具体兑换商品的名称，默认为1888京豆
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#工业品爱消除
30 * * * * https://raw.githubusercontent.com/shylocks/Loon/main/jd_gyec.js, tag=工业品爱消除, img-url=https://raw.githubusercontent.com/yogayyy/Scripts/main/Icon/shylock/jd_gyxxl.png, enabled=true

================Loon==============
[Script]
cron "30 * * * *" script-path=https://raw.githubusercontent.com/shylocks/Loon/main/jd_gyec.js,tag=工业品爱消除

===============Surge=================
工业品爱消除 = type=cron,cronexp="30 * * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/shylocks/Loon/main/jd_gyec.js

============小火箭=========
工业品爱消除 = type=cron,script-path=https://raw.githubusercontent.com/shylocks/Loon/main/jd_gyec.js, cronexpr="30 * * * *", timeout=200, enable=true
 */
const $ = new Env('工业品爱消除');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let inviteCodes = [
  '840266@2583822@2585219@2586018@1556311@2583822@2585256@2586023@2728968',
  '840266@2583822@2585219@2586018@1556311@2583822@2585256@2586023@2728968',
]
let exchangeName = $.isNode() ? (process.env.EXCHANGE_GYEC ? process.env.EXCHANGE_GYEC : '1888京豆') : ($.getdata('JDGYEC') ? $.getdata('JDGYEC') : '1888京豆')
//Node.js用户请在jdCookie.js处填写京东ck;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}

function obj2param(obj) {
  let str = "";
  for (let key in obj) {
    if (str !== "") {
      str += "&";
    }
    str += key + "=" + encodeURIComponent(obj[key]);
  }
  return str
}

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }
  $.shareCodesArr = []
  await requireConfig()
  console.log(`您要兑换的商品名称为${exchangeName}`)
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {"open-url": "https://bean.m.jd.com/"});
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        } else {
          $.setdata('', `CookieJD${i ? i + 1 : ""}`);//cookie失效，故清空cookie。$.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        }
        continue
      }
      await shareCodesFormat()
      await jdGy()
      await jdGy(false)
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function jdGy(help = true) {
  $.reqId = 1
  await getIsvToken()
  await getIsvToken2()
  await getActInfo()
  await getTaskList()
  if (help) await helpFriends()
  await marketGoods()
}

async function helpFriends() {
  for (let code of $.newShareCodes) {
    if (!code) continue
    console.log(`去助力好友${code}`)
    await getActInfo(code)
    await $.wait(500)
  }
}

// 获得IsvToken
function getIsvToken() {
  return new Promise(resolve => {
    $.post(jdUrl('encrypt/pin?appId=dafbe42d5bff9d82298e5230eb8c3f79'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            $.lkEPin = data.data
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

// 获得对应游戏的访问Token
function getIsvToken2() {
  return new Promise(resolve => {
    $.post(jdUrl('user/token?appId=dafbe42d5bff9d82298e5230eb8
