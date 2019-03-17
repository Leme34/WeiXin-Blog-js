import {
  String
} from '../../utils/util.js';

const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    blog: null,
    imageList: [],
    commentList: [],
    isVote: false,
    voteText: '赞',
    isMark: false,
    markText: '收藏',
    isShow: false, //是否显示输入框,
    replyContent: '', //绑定回复输入框的内容,
    replyUserName: '', //回复者
    replyUserId: 0, //回复者id
    replyCommentId: 0, //回复评论id
    userName: '',
    isMe: false
  },

  /**
   * 页面加载
   */
  onLoad: function(params) {
    let blog = JSON.parse(params.blog);
    let userInfo = wx.getStorageSync('userInfo');
    let isMe = false;
    if (userInfo && blog.userName == userInfo.username) {
      isMe = true;
    }
    //取出传过来的数据，用户信息用于判断是否评论者
    this.setData({
      blog: blog,
      //需要json解析
      imageList: JSON.parse(blog.imageList),
      isMe: isMe
    })

  },

  /**
   * 页面显示
   */
  onShow() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      //更新当前userName
      this.setData({
        userName: userInfo.username
      })
      //查询此用户是否有为博客点赞
      this.queryIsVote();
      //查询此用户是否有收藏此博客
      this.queryIsMark();
    }
    //查询评论列表(包含该用户是否有点赞此评论的标志)
    this.queryCommentList();
  },

  //查询此用户是否有为博客点赞
  queryIsVote() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.request({
        url: app.baseUrl + '/vote/blog',
        data: {
          userId: userInfo.id,
          blogId: this.data.blog.id
        },
        success: (res) => {
          console.log(res);
          if (res.data.statusCode == 200) {
            //若已点赞
            if (res.data.data) {
              this.setData({
                isVote: res.data.data,
                voteText: '取消点赞'
              })
            } else { //更改为未点赞状态
              this.setData({
                isVote: false,
                voteText: '赞'
              })
            }
          } else {
            app.dealSessionException(res);
            //再次请求
            this.onShow();
          }
        }
      })
    }
  },

  //点赞或取消点赞博客
  voteBlog() {
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: "../login/login?msg=登录后才能操作哦~&navigateBack=true",
      })
      return;
    }
    //取消点赞
    if (this.data.isVote) {
      wx.request({
        url: app.baseUrl + '/vote/blog?userId=' + userInfo.id + '&blogId=' + this.data.blog.id + '&username=' + userInfo.username,
        method: 'DELETE', //delete请求不能把参数写在data中
        success: (res) => {
          //更新是否点赞
          this.queryIsVote();
        }
      })
    } else { //点赞
      wx.request({
        url: app.baseUrl + '/vote/blog',
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded' //post请求必须加上,否则后台获取不了值
        },
        data: {
          userId: userInfo.id,
          blogId: this.data.blog.id,
          username: userInfo.username
        },
        success: (res) => {
          //更新是否点赞
          this.queryIsVote();
        }
      })
    }
  },

  //点击小键盘的确认按钮触发事件,提交评论
  saveComment(e) {
    let comment = e.detail.value;
    let userInfo = wx.getStorageSync('userInfo');
    // console.log(comment);
    // console.log(userInfo.id);
    //未登录
    if (!userInfo) {
      wx.navigateTo({
        url: "../login/login?msg=登录后才能评论哦~&navigateBack=true",
      })
      return;
    }
    //提交评论
    wx.request({
      url: app.baseUrl + '/comment',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' //post请求必须加上,否则后台获取不了值
      },
      data: {
        userId: userInfo.id,
        blogId: this.data.blog.id,
        content: comment
      },
      success: (res) => {
        console.log(res);
        if (res.data.statusCode == 200) {
          wx.showToast({
            title: res.data.data,
            icon: 'success',
            duration: 1500
          })
          //刷新
          this.queryCommentList();
          //清空输入框
          this.setData({
            contentValue: ''
          })
        } else if (res.data.statusCode == 401) {
          wx.showToast({
            title: 'sry~你没有权限哦',
            icon: 'none',
            duration: 1500
          })
        } else if (res.data.statusCode == 500) {
          wx.showToast({
            title: 'sry~服务器开小差了',
            icon: 'none',
            duration: 1500
          })
        } else {
          app.dealSessionException(res);
          //再次请求(会跳转登录)
          this.saveComment();
        }
      }
    })

  },

  //查询评论列表
  queryCommentList() {
    let url = app.baseUrl + '/comment?blogId=' + this.data.blog.id;
    //若已登录才传userId,用于判断是否有点赞此评论
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      url = app.baseUrl + '/comment?blogId=' + this.data.blog.id + '&userId=' + userInfo.id;
    }
    console.log('url=' + url);
    wx.request({
      url: url,
      success: (res) => {
        console.log(res.data.data);
        if (res.data.statusCode == 200) {
          this.setData({
            commentList: res.data.data
          })
        }
      }
    })
  },

  // 显示/隐藏输入框
  showReplyInput(e) {
    console.log("点击回复");
    let replyUserName = e.currentTarget.dataset.replyusername;
    //一级子评论和二级子评论的pid都=顶层父评论的id
    let replyCommentId = e.currentTarget.dataset.replycommentid;
    let replyUserId = e.currentTarget.dataset.replyuserid;
    //若回复的是父评论(一级子评论)则不传replyUserId
    if (!replyUserId) {
      replyUserId = 0;
    }

    //取反,记录需要回复的用户
    this.setData({
      isShow: !this.data.isShow,
      replyUserName: replyUserName,
      replyUserId: replyUserId,
      replyCommentId: replyCommentId
    })
    // console.log('replyCommentId='+this.data.replyCommentId);
  },

  //点击删除评论按钮
  del_comment(e) {
    let me = this;
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: "../login/login?msg=登录后才能操作哦~&navigateBack=true",
      })
      return;
    }
    //弹窗确认
    wx.showModal({
      title: '提示',
      content: '确认删除该评论吗~',
      success: function(res) {
        if (res.confirm) {
          console.log('用户点击确定');
          let commentId = e.currentTarget.dataset.id;
          let userInfo = wx.getStorageSync('userInfo');
          //请求服务器
          wx.request({
            url: app.baseUrl + '/comment?commentId=' + commentId + '&username=' + userInfo.username,
            method: 'DELETE',
            success: (res) => {
              console.log(res);
              if (res.data.statusCode == 200) {
                wx.showToast({
                  title: res.data.data,
                  icon: 'success',
                  duration: 1500
                })
                //刷新
                me.queryCommentList();
              } else {
                app.dealSessionException(res);
              }
            }
          })
        } else if (res.cancel) {
          return;
        }
      }
    })
  },

  //评论点赞按钮
  vote_comment(e) {
    //获取点赞的评论id
    let commentId = e.currentTarget.dataset.id;
    // console.log("点赞的评论id="+commentId);
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: "../login/login?msg=登录后才能操作哦~&navigateBack=true",
      })
      return;
    }
    //当前已点赞,取消点赞
    if (e.currentTarget.dataset.isvoted) {
      wx.request({
        url: app.baseUrl + '/vote/comment?userId=' + userInfo.id + '&commentId=' + commentId + '&username=' + userInfo.username,
        method: 'DELETE',
        success: (res) => {
          if (res.data.statusCode == 200) {
            //刷新页面
            this.onShow();
          } else {
            app.dealSessionException(res);
          }
        }
      })
    } else { //当前未点赞,点赞
      wx.request({
        url: app.baseUrl + '/vote/comment',
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        data: {
          userId: userInfo.id,
          commentId: commentId,
          username: userInfo.username
        },
        success: (res) => {
          if (res.data.statusCode == 200) {
            //刷新页面
            this.onShow();
          } else {
            app.dealSessionException(res);
          }
        }
      })
    }
  },

  //点击回复输入框的取消按钮
  cancel() {
    //取反
    this.setData({
      isShow: !this.data.isShow,
      replyContent: ''
    })
  },


  // (bindinput)实时保存回复内容
  setValue(e) {
    let replyContent = e.detail.value;
    this.setData({
      replyContent: replyContent
    })
    // console.log(this.data.replyContent);
  },



  //点击回复输入框的确认按钮
  confirm(e) {
    //评论为空
    if (this.data.replyContent.length == 0) {
      wx.showToast({
        title: '写点东西吧~',
        icon: 'none',
        duration: 1500
      })
      return;
    }
    //隐藏输入框
    this.setData({
      isShow: !this.data.isShow,
    })
    // console.log('提交内容是:'+this.data.replyContent);
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: "../login/login?msg=登录后才能评论哦~&navigateBack=true",
      })
      return;
    }
    let userId = userInfo.id;
    //否则已登录,提交评论
    wx.request({
      url: app.baseUrl + '/comment',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        userId: userInfo.id,
        blogId: this.data.blog.id,
        content: this.data.replyContent,
        pid: this.data.replyCommentId,
        replyUserId: this.data.replyUserId
      },
      success: (res) => {
        console.log(res);
        if (res.data.statusCode == 200) {
          wx.showToast({
            title: res.data.data,
            icon: 'success',
            duration: 1500
          })
          //刷新
          this.onShow();
        } else {
          app.dealSessionException(res);
        }
      }
    })

    //清空输入框内容
    this.setData({
      replyContent: ''
    })
  },

  toBlogEdit() {
    //带着blog信息跳转编辑页
    wx.navigateTo({
      url: '../blog-edit/blog-edit?blog=' + JSON.stringify(this.data.blog),
    })
  },

  delBlog() {
    let me = this;
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: "../login/login?msg=登录后才能操作哦~&navigateBack=true",
      })
      return;
    }
    //弹窗确认
    wx.showModal({
      title: '提示',
      content: '确认删除该博客吗~',
      success: function(res) {
        if (res.confirm) {
          console.log('用户点击确定');
          wx.request({
            url: app.baseUrl + '/blog?username=' + userInfo.username + '&blogId=' + me.data.blog.id,
            method: 'DELETE',
            success: (res) => {
              if (res.data.statusCode == 200) {
                wx.showToast({
                  title: res.data.data,
                  icon: 'success',
                  duration: 1500
                })
                //重定向到主页
                wx.switchTab({
                  url: '../index/index',
                })
                //请求文件服务器删除博客中的所有图片
                // console.log(JSON.parse(me.data.blog.imageList));
                let images = JSON.parse(me.data.blog.imageList);
                for (let i = 0; i < images.length; i++) {
                  console.log('删除的图片id=:' + images[i].id);
                  wx.request({
                    url: app.fileServerUrl + '/' + images[i].id,
                    method: 'DELETE'
                  })
                }
              }
            }
          })
        } else if (res.cancel) {
          return;
        }
      }
    })
  },

  queryIsMark() {
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.request({
        url: app.baseUrl + '/mark/blog',
        data: {
          userId: userInfo.id,
          blogId: this.data.blog.id
        },
        success: (res) => {
          console.log(res);
          if (res.data.statusCode == 200) {
            //若已收藏
            if (res.data.data) {
              this.setData({
                isMark: res.data.data,
                markText: '取消收藏'
              })
            } else { //更改为未收藏状态
              this.setData({
                isMark: false,
                markText: '收藏'
              })
            }
          } else {
            app.dealSessionException(res);
            //再次请求
            this.onShow();
          }
        }
      })
    }
  },

  //收藏博客
  markBlog() {
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: "../login/login?msg=登录后才能操作哦~&navigateBack=true",
      })
      return;
    }
    //取消收藏
    if (this.data.isMark) {
      wx.request({
        url: app.baseUrl + '/mark/blog?userId=' + userInfo.id + '&blogId=' + this.data.blog.id + '&username=' + userInfo.username,
        method: 'DELETE', //delete请求不能把参数写在data中
        success: (res) => {
          //更新是否收藏
          this.queryIsMark();
        }
      })
    } else { //收藏
      wx.request({
        url: app.baseUrl + '/mark/blog',
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded' //post请求必须加上,否则后台获取不了值
        },
        data: {
          userId: userInfo.id,
          blogId: this.data.blog.id,
          username: userInfo.username
        },
        success: (res) => {
          //更新是否点赞
          this.queryIsMark();
        }
      })
    }
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

})