const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    blogList:[]
  },

  //页面初始化
  onLoad: function(param) {
    console.log(param.key);
    if (param.key) {
      wx.showLoading({
        title: '加载中~',
      })
      //搜索博客
      wx.request({
        url: app.baseUrl + '/search/blog?key=' + param.key,
        success: (res) => {
          wx.hideLoading();
          console.log(res);
          if (res.data.statusCode == 200) {
            this.setData({
              blogList: res.data.data.data.content
            })
          }
        }
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
  }


})