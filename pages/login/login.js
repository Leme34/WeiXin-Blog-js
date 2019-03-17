import {
  String
} from '../../utils/util.js';

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    navigateBack: false  //登录成功后是否需要返回页面
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(params) {
    //注册成功跳转过来的标志
    let icon = 'none';
    if (!String.isBlank(params.flag)){
      icon = 'success';
    }
    console.log(params.msg);
    if (!String.isBlank(params.msg)) {
      wx.showToast({
        title: params.msg,
        icon: icon,
        duration: 2000
      })
    }
    //登录成功后是否需要返回页面
    if (!String.isBlank(params.navigateBack) && params.navigateBack){
      this.setData({
        navigateBack:true
      })
    }
  },


  doLogin(e) {
    let username = e.detail.value.username;
    let password = e.detail.value.password;
    // 简单验证
    if (username.length == 0 || password.length == 0) {
      wx.showToast({
        title: '用户名或密码不能为空',
        icon: 'none',
        duration: 2000 //2s后错误提示消失
      })
    } else { //否则表单不为空
      wx.showLoading({
        title: '请等待...',
      });
      //请求服务器进行登录
      wx.request({
        url: app.baseUrl + '/doLogin',
        method: 'POST',
        data: {
          username: username,
          password: password
        },
        //使用post请求必须加上
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        success: (res) => {
          wx.hideLoading(); //隐藏请等待...的提示
          console.log(res.data.body.data);
          //服务器返回成功
          if (res.data.statusCodeValue == 200) {
            //提示登录成功
            wx.showToast({
              title: '登录成功~',
              icon: 'success',
              duration: 2000
            })
            //服务器返回的用户登录信息添加本地缓存
            wx.setStorageSync("userInfo", res.data.body.data);
            //若非跳转过来的页面,则重定向到个人主页
            if (this.data.navigateBack==false) {
              wx.switchTab({
                url: '../mine/mine',
              })
            }else{
              wx.navigateBack({})
            }
          } else { //服务器返回错误
            console.log(res);
            wx.showToast({
              title: res.data.body.data,
              icon: 'none',
              duration: 2000
            })
          }

        }
      })
    }
  },

  goRegistPage() {
    wx.navigateTo({
      url: '../register/register',
    })
  }

})