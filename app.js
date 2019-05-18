/* 导入weapp-cookie使小程序支持cookie
 * 接口调用成功后 weapp-cookie 会自动保存后端发送的所有Cookie（比如：SessionID）
 * 并在后续的所有请求中带上，以保证基于 cookie 的服务器会话机制不会失效，
 * 实现与 web 端共用会话机制（无需再手动维护 3rd_session_key） 
 */
import './vendor/weapp-cookie/dist/weapp-cookie';
import cookies from './vendor/weapp-cookie/dist/weapp-cookie';

App({
  // 测试配置
  // baseUrl: 'http://localhost:8080',
  // //文件服务器url
  // fileServerUrl: 'http://localhost:8081',
  // //上传文件接口
  // fileUploadUrl: 'http://localhost:8081/upload',

  // 上线配置
  baseUrl: 'http://111.230.68.228:8080',
  //文件服务器url
  fileServerUrl: 'http://111.230.68.228:8081',
  //上传文件接口
  fileUploadUrl: 'http://111.230.68.228:8081/upload',


  //处理服务端返回session过期或者用户被挤下线错误
  dealSessionException(res) {
    // if (res.data.body.statusCode == 401 || res.data.body.statusCode == 201) { //服务端返回session过期或者用户被挤下线错误
    //   console.log(res.data.body.data);
    //清除微信小程序中此用户的cookie和用户认证信息缓存
    cookies.clearCookies();
    wx.clearStorageSync('userInfo');
    //提示重新登陆
    wx.showToast({
      title: '用户登录已过期,请重新登录~',
      icon: 'none',
      duration: 1500
    })
    // } else { //服务端返回其他错误
    //   console.log(res.data.body.data);
    // }
  }


})