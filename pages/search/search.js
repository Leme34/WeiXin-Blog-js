// 1 导入搜索模块js文件
const WxSearch = require('../../wxSearchView/wxSearchView.js');

const app = getApp()

Page({
  data: {
  },

  onLoad: function () {

    // 2 搜索栏组件初始化
    let that = this;

    // 查询前10名热搜词
    wx.request({
      url: app.baseUrl + '/search/hotKey?num=10',
      success: (res)=>{
        console.log(res);
        if(res.data.statusCode==200){
          let hotList = res.data.data.data;
          //使用WxSearch组件
          WxSearch.init(
            that,  // 本页面一个引用
            hotList,
            // ['慕课网', 'imooc', "java", "小程序", 'zookeeper', 'springboot'], // 热点搜索推荐，[]表示不使用
            hotList,// 搜索匹配，[]表示不使用
            that.mySearchFunction, // 提供一个搜索回调函数
            that.myGobackFunction //提供一个返回回调函数
          );
        }

      }
    })

  },

  // 3 转发函数，固定部分，直接拷贝即可
  wxSearchInput: WxSearch.wxSearchInput,  // 输入变化时的操作
  wxSearchKeyTap: WxSearch.wxSearchKeyTap,  // 点击提示或者关键字、历史记录时的操作
  wxSearchDeleteAll: WxSearch.wxSearchDeleteAll, // 删除所有的历史记录
  wxSearchConfirm: WxSearch.wxSearchConfirm,  // 搜索函数
  wxSearchClear: WxSearch.wxSearchClear,  // 清空函数

  // 4 搜索回调函数  
  mySearchFunction: function (value) {
    // 请求缓存热搜词
    wx.request({
      url: app.baseUrl +'/search/hotKey',
      method:'POST',
      header:{
        'content-type': 'application/x-www-form-urlencoded'
      },
      data:{
        key:value
      },
      success:(res)=>{
        if(res.data.statusCode==200){
          console.log(res.data.data);
          // 跳转
          wx.navigateTo({
            url: '../search-result/search-result?key=' + value
          })
        }
      }
    })
    
  },

  // 5 返回回调函数
  myGobackFunction: function () {
    // 返回主页
    wx.switchTab({
      url: '../index/index'
    })
  }


})