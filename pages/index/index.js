import cookies from '../../vendor/weapp-cookie/dist/weapp-cookie'
//导入搜索栏模块的js文件
var WxSearch = require('../../wxSearchView/wxSearchView.js');

//获取应用实例
const app = getApp()

Page({
  data: {
    blogList: [],
    index: 0, //点击跳转博客的列表下标
    currentPage: 1, //当前页数
    totalPage: 1, //总页数
  },

  //页面初始化
  onLoad: function() {

  },

  //页面显示
  onShow() {
    wx.showLoading({
      title: '请等待,加载中...',
    });
    //请求服务器加载博文列表
    this.queryBlogList(1);
  },

  queryBlogList(page){
    if (page == 1) {
      //清空之前请求的(多页)数据
      this.setData({
        blogList: []
      })
    }
    wx.request({
      url: app.baseUrl + '/blog/list?page=' + page,
      method: "GET",
      success: (res) => {
        console.log(res);
        //服务端返回成功
        if (res.data.statusCode == 200) {
          //隐藏导航条处的小圆圈加载中动画
          wx.hideNavigationBarLoading();
          //停止下拉刷新(为了隐藏其动画)
          wx.stopPullDownRefresh();
          wx.hideLoading();
          //取出原数组,拼接上本次请求的(下一页)数据
          let blogList = this.data.blogList.concat(res.data.data.list);
          this.setData({
            blogList: blogList,
            currentPage: res.data.data.pageNum, //当前页数
            totalPage: res.data.data.pages //总页数
          })
        } else {
          app.dealSessionException(res);
          //再次请求
          this.queryBlogList(1);
        }
      }
    })
  },

  //点击博主头像跳转其主页
  toUserPage(e) {
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

  toBlogDetail(e) {
    let index = e.currentTarget.dataset.index;
    console.log(this.data.blogList[index]);
    //跳转博客详细页
    wx.navigateTo({
      url: '../blog-detail/blog-detail?blog=' + JSON.stringify(this.data.blogList[index])
    })
  },

  //下拉刷新
  onPullDownRefresh() {
    //导航条处显示小圆圈加载中动画
    wx.showNavigationBarLoading();
    //刷新
    this.queryBlogList(1);
  },


  //触底加载更多(分页实现)
  onReachBottom() {
    let currentPage = this.data.currentPage;
    let totalPage = this.data.totalPage;
    //若当前页数与总页数相等则没有更多数据
    if (currentPage == totalPage) {
      wx.showToast({
        title: '到底啦~',
        icon: "none"
      });
      return;
    }
    //请求后台获取下一页数据
    this.queryBlogList(currentPage + 1);
  },

  //跳转搜索页
  toSearchPage() {
    wx.navigateTo({
      url: '../search/search',
    })
  }

})