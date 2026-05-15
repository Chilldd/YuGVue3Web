# 性能规范

禁止：

- 深 watch 滥用
- 大对象 reactive
- 重复 API 请求
- 页面初始化过多请求

推荐：

- computed 优先
- shallowRef
- 懒加载
- 路由拆分
