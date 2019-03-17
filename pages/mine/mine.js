import cookies from '../../vendor/weapp-cookie/dist/weapp-cookie'

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    faceUrl: "../../images/avatar-defualt.png", //默认头像url
    isMe: true,
    isFollow: false,
    loginStatus: false,
    nickname: '',
    email: '',
    blogSelClass: "blog-info",
    isSelectedWork: "blog-info-selected",
    isSelectedLike: "",
    isSelectedFollow: "",
    isSelectedFollower: "",
    index: 0, //点击跳转博客的列表下标
    myBlogList: [],
    myBlogPage: 1,
    myBlogTotal: 1,

    likeBlogList: [],
    likeBlogPage: 1,
    likeBlogTotal: 1,

    followBlogList: [],
    followBlogPage: 1,
    followBlogTotal: 1,

    myWorkFalg: false,
    myLikesFalg: true,
    myFollowFalg: true,
    myFollowerFalg: true
  },

  /**
   * 页面加载
   */
  onLoad: function() {


  },


  /**
   * 页面显示时触发
   */
  onShow() {
    //初始化page对象
    this.initPageData();
    //验证是否登录
    wx.request({
      url: app.baseUrl + '/validLogin',
      success: (res) => {
        console.log("本次查出的res.data.data.avatar=" + res.data.data.avatar);
        if (res.data.statusCode == 401) {
          app.dealSessionException(res);
          return;
        }
      }
    })
    let userInfo = wx.getStorageSync('userInfo');
    //若已登录则获取用户信息和博客列表
    if (userInfo) {
      //查询最新用户信息
      this.getMyInfo();
      //获取自己发表的博客
      this.getMyBlogs();
    }
  },

  getMyInfo() {
    let userInfo = wx.getStorageSync('userInfo');
    wx.request({
      url: app.baseUrl + '/user/' + userInfo.username,
      success: (res) => {
        console.log("本次查出的res.data.data.avatar=" + res.data.data.avatar);
        if (res.data.statusCode == 200) {
          //更新页面个人信息数据
          this.setData({
            loginStatus: true,
            faceUrl: res.data.data.avatar == null ? this.data.faceUrl : res.data.data.avatar,
            nickname: res.data.data.username,
            email: res.data.data.email,
            fansCounts: res.data.data.fansCounts,
            followCounts: res.data.data.followCounts,
            bgImg: res.data.data.bgImg
          })
          //更新缓存中的userInfo数据
          wx.setStorageSync('userInfo', res.data.data);
        } else {
          app.dealSessionException(res);
          //再次请求
          this.onShow();
        }
      }
    })
  },

  getMyBlogs() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.request({
        url: app.baseUrl + '/user/' + userInfo.username + '/blogs',
        method: 'GET',
        success: (res) => {
          console.log(res.data);
          //服务器返回成功
          if (res.statusCode == 200) {
            let myBlogList = res.data.data;
            let voteCounts = 0;
            //计算用户获赞总数
            for (let i = 0; i < myBlogList.length; i++) {
              voteCounts += myBlogList[i].voteSize;
            }
            //set页面数据
            this.setData({
              myBlogList: myBlogList,
              voteCounts: voteCounts
            })
          } else {
            app.dealSessionException(res);
            //再次请求
            this.onShow();
          }
        }
      })
    }
  },

  //写博客
  uploadBlog() {
    //跳转edit页
    wx.navigateTo({
      url: '../blog-edit/blog-edit',
    })
  },

  toLogin() {
    wx.navigateTo({
      url: '../login/login',
    })
  },

  toRegister() {
    wx.navigateTo({
      url: '../register/register',
    })
  },

  toBlogDetail(e) {
    let index = e.currentTarget.dataset.index;
    //跳转博客详细页
    wx.navigateTo({
      url: '../blog-detail/blog-detail?blog=' + JSON.stringify(this.data.myBlogList[index])
    })
  },

  logout() {
    //清除用户信息缓存
    wx.removeStorageSync("userInfo");

    //请求服务器销毁session
    wx.request({
      url: app.baseUrl + '/signOut',
      method: 'GET',
      success: (res) => {
        console.log(res);
        wx.showToast({
          title: res.data.body.data,
          icon: 'success',
          duration: 1500
        })
      }
    })

    //初始化page对象
    this.initPageData();

  },


  //头像编辑
  changeFace() {
    let me = this;
    //未登录
    if (!me.data.loginStatus) {
      wx.showToast({
        title: '请先登录~',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], //压缩图片
      sourceType: ['album'], //从相册选择
      success: function(res) {
        let tempFilePaths = res.tempFilePaths;
        console.log(tempFilePaths);

        wx.showLoading({
          title: '上传中...',
        })
        let userInfo = wx.getStorageSync('userInfo');
        //请求上传文件
        wx.uploadFile({
          url: app.fileUploadUrl,
          method: 'POST',
          data: {
            userId: userInfo.id,
            isHeadImg: 1
          },
          filePath: tempFilePaths[0], //上传图片的路径列表
          name: 'file', //对应服务器@RequestParam的value
          header: {
            'content-type': 'application/json', // 默认值
          },
          success: function(res) {
            wx.hideLoading();
            if (res.statusCode == 200) {
              //与wx.request不同wx.uploadFile接受的服务器端返回的是String类型,需要转为json对象才能取值
              let result = {
                id: res.data,
                url: app.fileServerUrl + "/view/" + res.data
              }
              console.log("文件服务器返回的图片地址为:" + result.url);
              wx.showToast({
                title: '上传成功!~~',
                icon: "success",
                duration: 1500
              });
              //请求服务器更新用户头像地址
              wx.request({
                url: app.baseUrl + '/user/' + userInfo.username,
                method: 'POST',
                header: {
                  'content-type': 'application/x-www-form-urlencoded' //post请求必须加上,否则后台获取不了值
                },
                data: {
                  avatar: result.url
                },
                success: (res) => {
                  if (res.data && res.data.statusCode == 200) {
                    //更新页面和userInfo缓存数据
                    me.onShow();
                  } else {
                    app.dealSessionException(res);
                  }
                }
              })
            } else {
              app.dealSessionException(res);
            }
          }
        })
      }
    })
  },

  doSelectWork() {
    this.setData({
      isSelectedWork: "blog-info-selected",
      isSelectedLike: "",
      isSelectedFollow: "",
      isSelectedFollower: "",
      myWorkFalg: false,
      myLikesFalg: true,
      myFollowFalg: true,
      myFollowerFalg: true
    })
    //获取自己发表的博客
    this.getMyBlogs();
  },


  doSelectLike() {
    this.setData({
      isSelectedWork: "",
      isSelectedLike: "blog-info-selected",
      isSelectedFollow: "",
      isSelectedFollower: "",
      myWorkFalg: true,
      myLikesFalg: false,
      myFollowFalg: true,
      myFollowerFalg: true
    })
    //获取自己收藏的博客
    this.getMarkBlogs();
  },

  doSelectFollow() {
    this.setData({
      isSelectedWork: "",
      isSelectedLike: "",
      isSelectedFollow: "blog-info-selected",
      isSelectedFollower: "",
      myWorkFalg: true,
      myLikesFalg: true,
      myFollowFalg: false,
      myFollowerFalg: true
    })
    //查看此用户关注的人
    this.getFollowUsers();
  },

  doSelectFollower() {
    this.setData({
      isSelectedWork: "",
      isSelectedLike: "",
      isSelectedFollow: "",
      isSelectedFollower: "blog-info-selected",
      myWorkFalg: true,
      myLikesFalg: true,
      myFollowFalg: true,
      myFollowerFalg: false
    })
    //查看此用户的粉丝
    this.getFollowers();
  },

  getFollowers() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.request({
        url: app.baseUrl + '/user/followers?userId=' + userInfo.id,
        success: (res) => {
          if (res.data.statusCode == 200) {
            console.log(res);
            this.setData({
              followList: res.data.data
            })
          }
        }
      })
    }
  },

  getMarkBlogs() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.request({
        url: app.baseUrl + '/mark/' + userInfo.id,
        success: (res) => {
          console.log(res);
          if (res.data.statusCode == 200) {
            this.setData({
              myBlogList: res.data.data.data
            })
          }
        }
      })
    }
  },

  //查看此用户关注的人
  getFollowUsers() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.request({
        url: app.baseUrl + '/user/follow?followerId=' + userInfo.id,
        success: (res) => {
          if (res.data.statusCode == 200) {
            this.setData({
              followList: res.data.data
            })
          }
        }
      })
    }
  },

  toUserpage(e) {
    let username = e.currentTarget.dataset.username;
    let userInfo = wx.getStorageSync('userInfo');
    //若已登录则判断是否当前用户本人
    if (userInfo && username == userInfo.username) {
      console.log("是本人跳转mine");
      wx.switchTab({
        url: '../mine/mine',
      })
    } else { //非本人或未登录,带上需要跳转用户页的username跳转博主页
      console.log('跳转用户：' + username);
      wx.navigateTo({
        url: '../userpage/userpage?username=' + username,
      })
    }
  },

  // 初始化page对象
  initPageData() {
    this.setData({
      faceUrl: "../../images/avatar-defualt.png", //默认头像url
      bgImg: '',
      isMe: true,
      isFollow: false,
      loginStatus: false,
      nickname: '',
      email: '',
      blogSelClass: "blog-info",
      isSelectedWork: "blog-info-selected",
      isSelectedLike: "",
      isSelectedFollow: "",
      isSelectedFollower: "",
      myBlogList: [],
      myBlogPage: 1,
      myBlogTotal: 1,

      likeBlogList: [],
      likeBlogPage: 1,
      likeBlogTotal: 1,

      followBlogList: [],
      followBlogPage: 1,
      followBlogTotal: 1,

      fansCounts: 0,
      followCounts: 0,
      voteCounts: 0,

      myWorkFalg: false,
      myLikesFalg: true,
      myFollowFalg: true,
      myFollowerFalg: true
    })
  },

  changeBgImg() {
    let me = this;
    //未登录
    if (!me.data.loginStatus) {
      wx.showToast({
        title: '请先登录~',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], //压缩图片
      sourceType: ['album'], //从相册选择
      success: function(res) {
        let tempFilePaths = res.tempFilePaths;
        console.log(tempFilePaths);

        wx.showLoading({
          title: '上传中...',
        })
        let userInfo = wx.getStorageSync('userInfo');
        //请求上传文件
        wx.uploadFile({
          url: app.fileUploadUrl,
          method: 'POST',
          data: {
            userId: userInfo.id,
            isHeadImg: 2 //个人主页背景文件
          },
          filePath: tempFilePaths[0], //上传图片的路径列表
          name: 'file', //对应服务器@RequestParam的value
          header: {
            'content-type': 'application/json', // 默认值
          },
          success: function(res) {
            wx.hideLoading();
            if (res.statusCode == 200) {
              //与wx.request不同wx.uploadFile接受的服务器端返回的是String类型,需要转为json对象才能取值
              let result = {
                id: res.data,
                url: app.fileServerUrl + "/view/" + res.data
              }
              console.log("文件服务器返回的图片地址为:" + result.url);
              wx.showToast({
                title: '上传成功!~~',
                icon: "success",
                duration: 1500
              });
              //请求服务器更新用户背景地址
              wx.request({
                url: app.baseUrl + '/user/' + userInfo.username,
                method: 'POST',
                header: {
                  'content-type': 'application/x-www-form-urlencoded' //post请求必须加上,否则后台获取不了值
                },
                data: {
                  bgImg: result.url
                },
                success: (res) => {
                  if (res.data && res.data.statusCode == 200) {
                    //更新页面和userInfo缓存数据
                    me.onShow();
                  } else {
                    app.dealSessionException(res);
                  }
                }
              })
            } else {
              app.dealSessionException(res);
            }
          }
        })
      }
    })
  }

})