const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //默认可以点击获取验证码
    btnStatus: true,
    //按钮使能计时器
    countdown: 60,
    email: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

  },

  doRegist: function(e) {
    let me = this;
    let formObject = e.detail.value;
    let username = formObject.username;
    let password = formObject.password;
    let captcha = formObject.captcha;
    let email = me.data.email;
    console.log('captcha=' + captcha);
    // 若表单未填写完整直接返回
    if (username.length == 0 || password.length == 0 || email.length == 0 || captcha.length == 0) {
      wx.showToast({
        title: '请填写完整哦~',
        icon: 'none',
        duration: 2000 //2s后错误提示消失
      })
      return;
    }
    //否则表单不为空
    //若邮箱为空或不合法,直接返回
    if (me.validateEmail(email) == false) {
      return;
    }
    wx.showLoading({
      title: '请等待...',
    });
    //请求后台注册
    wx.request({
      url: app.baseUrl + '/register',
      header: {
        'content-type': 'application/x-www-form-urlencoded' //post请求必须加上,否则后台获取不了值
      },
      method: "POST",
      data: {
        captcha: captcha,
        email: email,
        password: password,
        username: username,
      },
      success: function(res) {
        console.log(res.data);
        wx.hideLoading(); //隐藏请等待...的提示
        //后台响应成功
        if (res.data.statusCode == 200) {
          wx.showToast({
              title: res.data.data,
              icon: 'success',
              duration: 3000
            }),
            // 返回登录页
            wx.redirectTo({
            url: '../login/login?msg=注册成功~&flag=1',
            })
        } else { //显示后台响应的错误信息
          wx.showToast({
            title: res.data.data,
            icon: 'none',
            duration: 2000
          })

        }
      },
    })

  },

  //邮箱输入框失去焦点事件(bindblur)
  getEmail(e) {
    //保存此次输入的email
    let email = e.detail.value;
    this.setData({
      email: email
    })
  },


  //点击获取验证码按钮
  getCpatcha() {
    wx.showLoading({
      title: '请等待...',
    });

    let email = this.data.email;
    //若邮箱为空或不合法,直接返回
    if (this.validateEmail(email) == false) {
      return;
    }

    //若未到时间不能再向下执行
    if (this.data.countdown != 60) {
      wx.showToast({
        title: '请在' + this.data.countdown + 's后再试~',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    //若以上校验通过
    if (this.data.btnStatus) {
      //请求服务器发送验证码到此邮箱
      wx.request({
        url: app.baseUrl + '/sendEmail',
        data: {
          email: this.data.email
        },
        success: (res) => {
          wx.hideLoading(); //隐藏请等待...的提示
          console.log(res.data);
          if (res.data.statusCode == 200) {
            wx.hideLoading();
            //开始计时,60s后就会让按钮使能
            this.setTime();
            wx.showToast({
              title: res.data.data,
              icon: 'success',
              duration: 2000
            })
          }else{
            wx.showToast({
              title: res.data.data,
              icon: 'none',
              duration: 2000
            })
          }
        }
      })
    }

  },

  //实现每隔60s发送一次
  setTime() {
    //先禁用按钮
    this.setData({
      btnStatus: false
    })
    //倒计时60s完成,按钮重新使能,并重置倒计时
    if (this.data.countdown == 0) {
      this.setData({
        btnStatus: true,
        countdown: 60
      })
    } else { //倒计时未完成,继续计时
      let countdown = this.data.countdown - 1;
      this.setData({
        countdown: countdown
      })
      //1s后继续递归调用
      setTimeout(this.setTime, 1000);
    }
  },

  //校验邮箱是否合法或为空
  validateEmail(email) {
    let reg = new RegExp("^([a-z0-9A-Z]+[-|\\.]?)+[a-z0-9A-Z]@([a-z0-9A-Z]+(-[a-z0-9A-Z]+)?\\.)+[a-zA-Z]{2,}$");
    //若邮箱为空或不合法,直接返回
    if (email == '' || !reg.test(email)) {
      //提示
      wx.showToast({
        title: '请输入正确的邮箱地址~',
        icon: 'none',
        duration: 2000
      })
      return false;
    }
    return true;
  },

  //跳转注册页
  goLoginPage: function() {
    wx.navigateBack({})
  }

})