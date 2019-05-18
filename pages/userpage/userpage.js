import cookies from '../../vendor/weapp-cookie/dist/weapp-cookie'

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    faceUrl: "../../images/avatar-defualt.png", //默认头像url
    isMe: false,
    isFollow: false,
    userId: -1,
    loginStatus: false,
    index: 0, //点击跳转博客的列表下标
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

    myWorkFalg: false,
    myLikesFalg: true,
    myFollowFalg: true,
    myFollowerFalg: true
  },

  /**
   * 页面加载
   */
  onLoad: function(params) {
    //传过来的数据
    // console.log('params.username=' + params.username);

    if (params != null) {
      //set页面个人信息数据
      this.setData({
        username: params.username
      })

      //查询此博主的个人信息
      wx.request({
        url: app.baseUrl + '/user/' + this.data.username,
        method: 'GET',
        success: (res) => {
          console.log(res.data);
          //服务器返回成功
          if (res.statusCode == 200) {
            //set页面数据
            this.setData({
              faceUrl: res.data.data.avatar,
              nickname: res.data.data.username,
              email: res.data.data.email,
              userId: res.data.data.id,
              fansCounts: res.data.data.fansCounts,
              followCounts: res.data.data.followCounts,
              bgImg: res.data.data.bgImg
            })
            //查询此博主发表的所有博客
            this.getMyBlogs();
            //是否有关注此博主
            this.queryIsFollower();
          } else {
            app.dealSessionException(res);
            //再次请求
            this.onShow();
          }
        }
      })
    }

  },

  getUserInfo() {
    wx.request({
      url: app.baseUrl + '/user/' + this.data.username,
      method: 'GET',
      success: (res) => {
        console.log(res.data);
        //服务器返回成功
        if (res.statusCode == 200) {
          //set页面数据
          this.setData({
            faceUrl: res.data.data.avatar,
            nickname: res.data.data.username,
            email: res.data.data.email,
            userId: res.data.data.id,
            fansCounts: res.data.data.fansCounts,
            followCounts: res.data.data.followCounts
          })
        }
      }
    })
  },

  toBlogDetail(e) {
    let index = e.currentTarget.dataset.index;
    //跳转博客详细页
    wx.navigateTo({
      url: '../blog-detail/blog-detail?blog=' + encodeURIComponent(JSON.stringify(this.data.myBlogList[index]))
    })
  },

  getMyBlogs() {
    wx.request({
      url: app.baseUrl + '/user/' + this.data.username + '/blogs',
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

  },

  doSelectWork() {
    this.setData({
      isSelectedWork: "blog-info-selected",
      isSelectedLike: "",
      isSelectedFollow: "",
      isSelectedFollower: "",
      myWorkFalg: false,
      myLikesFalg: true,
      myFollowFalg: true
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
    wx.request({
      url: app.baseUrl + '/user/followers?userId=' + this.data.userId,
      success: (res) => {
        if (res.data.statusCode == 200) {
          console.log(res);
          this.setData({
            followList: res.data.data
          })
        }
      }
    })
  },


  getMarkBlogs() {
    wx.request({
      url: app.baseUrl + '/mark/' + this.data.userId,
      success: (res) => {
        console.log(res);
        if (res.data.statusCode == 200) {
          this.setData({
            myBlogList: res.data.data.data
          })
        }
      }
    })

  },


  //关注
  followMe() {
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: "../login/login?msg=登录后才能操作哦~&navigateBack=true",
      })
      return;
    }
    wx.request({
      url: app.baseUrl + '/user/follow',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        userId: this.data.userId,
        followerId: userInfo.id
      },
      success: (res) => {
        if (res.data.statusCode == 200) {
          wx.showToast({
            title: res.data.data,
            icon: 'success',
            duration: 1000
          })
          //更新关注状态
          this.queryIsFollower();
          this.getUserInfo();
          this.getFollowers();
        }
      }
    })
  },


  queryIsFollower() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.request({
        url: app.baseUrl + '/user/isFollower',
        data: {
          userId: this.data.userId,
          followerId: userInfo.id
        },
        success: (res) => {
          if (res.data.statusCode == 200) {
            this.setData({
              isFollow: res.data.data
            })
          }
        }
      })
    }
  },

  cancelfollowMe() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.request({
        url: app.baseUrl + '/user/followers?userId=' + this.data.userId + '&followerId=' + userInfo.id,
        method: 'DELETE',
        success: (res) => {
          if (res.data.statusCode == 200) {
            wx.showToast({
              title: res.data.data,
              icon: 'success',
              duration: 1000
            })
            //更新关注状态
            this.queryIsFollower();
            this.getUserInfo();
            this.getFollowers();
          }
        }
      })
    }
  },


  //查看此用户关注的人
  getFollowUsers() {
    wx.request({
      url: app.baseUrl + '/user/follow?followerId=' + this.data.userId,
      success: (res) => {
        if (res.data.statusCode == 200) {
          console.log(res);
          this.setData({
            followList: res.data.data
          })
        }
      }
    })
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
      isMe: true,
      isFollow: false,
      loginStatus: false,

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

      myWorkFalg: false,
      myLikesFalg: true,
      myFollowFalg: true,
      myFollowerFalg: true
    })
  }

})