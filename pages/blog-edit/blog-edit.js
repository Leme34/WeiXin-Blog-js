const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //上传后的图片(预览列表)
    images: [],
    del_images: [], //待删除图片的id列表,在保存博客后再请求图片服务器删除图片
    select: false,
    categoryList: [], //此用户创建的分类
    index: -1, //用户当前选择的分类在列表中的下标
    isEdit: false,
    //编辑博客绑定的数据
    blog: null,
    blogTitle: '',
    blogSummary: '',
    blogContent: '',
    hiddenmodal: true, //添加分类模态框默认隐藏
    inputData: '' //添加分类模态框输入的内容
  },

  /**
   * 页面加载
   */
  onLoad: function(params) {
    console.log(params.blog);
    //若传参不为空则是编辑博客
    if (params.blog) {
      let blog = JSON.parse(params.blog);
      console.log(blog);

      //标志为修改博客,并显示原博客数据
      this.setData({
        isEdit: true,
        blog: blog,
        images: JSON.parse(blog.imageList),
        blogTitle: blog.title,
        blogSummary: blog.summary,
        blogContent: blog.content,
      })
      //查询此用户创建的所有分类,小程序不支持同步请求
      this.getCategoryList(this.data.blog.category);
      return;
    }

    //查询此用户创建的所有分类
    this.getCategoryList();
  },

  //上传图片按钮事件
  uploadImage() {
    const me = this;

    wx.chooseImage({
      success(res) {
        const tempFilePaths = res.tempFilePaths; //临时文件路径
        //上传图片到文件服务器
        wx.uploadFile({
          url: app.fileUploadUrl,
          filePath: tempFilePaths[0],
          name: 'file', //controller的入参名
          success(res) {
            if (res.statusCode != 200) {
              wx.showToast({
                title: '上传图片失败!',
                icon: "none",
                duration: 1500
              })
              return;
            }
            //与wx.request不同wx.uploadFile接受的服务器端返回的是String类型,需要转为json对象才能取值
            //添加到图片对象列表
            let image = {
              id: res.data,
              url: app.fileServerUrl + "/view/" + res.data
            }
            me.data.images.push(image);
            //必须setData之后页面的数据才会更新
            me.setData({
              images: me.data.images
            })
            // console.log(me.data.images);
          },
        })
      }
    });
  },

  //删除图片按钮事件
  del_img(e) {
    let me = this;
    let index = e.currentTarget.dataset.index;
    //1、加入待删除图片的id列表
    let del_images = me.data.del_images; //取出原列表
    del_images.push(me.data.images[index].id);
    //2、从图片列表移除
    me.data.images.splice(index, 1);


    //3、必须setData之后页面的数据才会更新
    me.setData({
      images: me.data.images,
      del_images: del_images
    })
    console.log(me.data.del_images);
  },

  //点击提交博客
  bindFormSubmit(e) {
    //文本内容
    let title = e.detail.value.blogTitle;
    let summary = e.detail.value.blogSummary;
    let content = e.detail.value.blogContent;
    let userInfo = wx.getStorageSync('userInfo');
    //获取分类,若用户未选择分类则categoryId=-1
    let index = this.data.index;
    let categoryId = index == -1 ? -1 : this.data.categoryList[index].id;
    //修改博客要提交blogId,新增不提交blogId
    let blogId = null;
    if (this.data.isEdit) {
      blogId = this.data.blog.id;
    }
    //请求服务器保存blog
    wx.request({
      url: app.baseUrl + '/blog/' + userInfo.username + '/edit',
      method: 'POST',
      data: {
        id: blogId,
        username: userInfo.username,
        summary: summary,
        title: title,
        categoryId: categoryId,
        userId: userInfo.id,
        imageList: this.data.images,
        content: content
      },
      success: (res) => {
        console.log(res);
        if (res.data.statusCode == 200) {
          //遍历待删除图片的index列表,请求图片服务器删除图片
          if (this.data.del_images.length > 0) {
            for (let i = 0; i < this.data.del_images.length; i++) {
              console.log('删除的图片id=:' + this.data.del_images[i]);
              wx.request({
                url: app.fileServerUrl + '/' + this.data.del_images[i],
                method: 'DELETE'
              })
            }
          }
          wx.showToast({
            title: "保存成功~！！！",
            icon: 'success',
            duration: 2000
          })
          //重定向到tarbar的首页
          wx.switchTab({
            url: '../index/index',
          })
        } else if (res.statusCode == 500){
          wx.showToast({
            title: 'sry~服务器开小差了',
            icon: 'none',
            duration: 1500
          })
        }else {
          app.dealSessionException();
          wx.showToast({
            title: res.data.data,
            icon: 'none',
            duration: 1500
          })
        }
      }
    })
  },

  //================自定义实现下拉列表=======================

  //点击显示下拉列表
  bindShowMsg() {
    //若是收起列表无需查询
    if (!this.data.select) {
      //查询此用户的分类
      this.getCategoryList();
    }
    //显示/收起列表
    this.setData({
      categoryList: this.data.categoryList,
      select: !this.data.select
    })
  },

  //点击下拉列表的item
  mySelect(e) {
    let index = e.currentTarget.dataset.index;
    // console.log("当前点击的分类下标是:" + index);
    //设置当前点击的分类名称,并收起列表
    this.setData({
      index: index,
      select: false
    })
  },

  //查询此用户创建的所有分类
  getCategoryList(category) {
    let me = this;
    let userInfo = wx.getStorageSync('userInfo');
    wx.request({
      url: app.baseUrl + '/user/category',
      data: {
        userId: userInfo.id
      },
      method: 'GET',
      success: (res) => {
        //服务器返回成功,设置数据
        if (res.data.statusCode == 200) {
          //查找原博客分类的index 
          let index = -1;
          if (category) {
            for (let i = 0; i < 1; i++) {
              // console.log('此用户的categoryList[' + i + '].name=' + res.data.data[i].name);
              if (res.data.data[i].name == category) {
                index = i;
              }
            }
          }
          //选择原博客分类的index
          me.setData({
            categoryList: res.data.data,
            index: index
          })
          // console.log(me.data.categoryList);
        } else {
          wx.showToast({
            title: res.data.data,
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },

  showModal() {
    this.setData({
      hiddenmodal: false
    });
  },

  getInputData(e) {
    let inputData = e.detail.value;
    this.setData({
      inputData: inputData
    })
  },

  //取消按钮
  cancel() {
    this.setData({
      hiddenmodal: true,
      inputData: ''
    });
  },

  //确认按钮,保存分类
  confirm() {
    let userInfo = wx.getStorageSync('userInfo');
    wx.request({
      url: app.baseUrl + '/user/category',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        userId: userInfo.id,
        name: this.data.inputData
      },
      success: (res) => {
        if (res.data.statusCode == 200) {
          wx.showToast({
            title: res.data.data,
            icon: 'success',
            duration: 1000
          })
        }
        this.setData({
          hiddenmodal: true,
          inputData: ''
        });
      }
    })
  }
})