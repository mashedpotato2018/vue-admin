<template>
  <div class="app-container">
    <div class="filter-container">
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <el-input v-model="listQuery.ip" placeholder="服务器IP" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
          <el-date-picker
            v-model="listQuery.bTime"
            type="date"
            style="vertical-align: top"
            placeholder="开始时间"
          />
          <el-date-picker
            v-model="listQuery.eTime"
            type="date"
            style="vertical-align: top"
            placeholder="结束时间"
          />
          <span
            style="margin: 0 10px;vertical-align: middle"
          >最少金额:</span>
          <el-input-number
            v-model="listQuery.minMoney"
            style="vertical-align: top"
            label=""
            @change="handleChange"
          />
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
            查询
          </el-button>
          <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">
            下载表格
          </el-button>
        </div>
        <div>
          <el-table
            :key="tableKey"
            v-loading="listLoading"
            :data="list"
            border
            fit
            highlight-current-row
            style="width: 100%;"
            @sort-change="sortChange"
          >
            <el-table-column label="所在服务器IP" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.IPAddress }}</span>
              </template>
            </el-table-column>
            <el-table-column label="所在服务器名称" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.GameName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="用户游戏ID" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.UserID }}</span>
              </template>
            </el-table-column>
            <el-table-column label="手机号" align="center">
              <template slot-scope="{row}">
                <span>{{ row.PhoneNumber }}</span>
              </template>
            </el-table-column>
            <el-table-column label="在线充值总额" align="center" prop="TotalRechargeLimit" sortable="custom">
              <template slot-scope="scope">
                <span>{{ scope.row.TotalRechargeLimit }}</span>
              </template>
            </el-table-column>
            <el-table-column label="提现总额" prop="TotalWithdrawalLimit" sortable="custom">
              <template slot-scope="scope">
                <span>{{ scope.row.TotalWithdrawalLimit }}</span>
              </template>
            </el-table-column>
            <el-table-column label="注册时间" align="center" prop="RegisterTime" sortable="custom">
              <template slot-scope="{row}">
                <span>{{ row.RegisterTime | DateFormat | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最后登陆时间" class-name="status-col" prop="LastLogonTime" sortable="custom">
              <template slot-scope="{row}">
                <span>{{ row.LastLogonTime | DateFormat | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="注册地址" class-name="status-col">
              <template slot-scope="{row}">
                <span>{{ row.RegisterIP }}</span>
              </template>
            </el-table-column>
            <el-table-column label="支付宝" class-name="status-col">
              <template slot-scope="{row}">
                <span>{{ row.AlipayNumber }}</span>
              </template>
            </el-table-column>
            <el-table-column label="银行卡" class-name="status-col">
              <template slot-scope="{row}">
                <span>{{ row.BankNumber }}</span>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="total>0"
            :total="total"
            :page.sync="listQuery.page"
            :limit.sync="listQuery.limit"
            @pagination="getList"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { fetchList } from '@/api/recharge'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    DateFormat(str) {
      return parseInt(str.substr(6, 13))
    },
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 10,
        bTime: parseTime(new Date().setDate(new Date().getDate() - 7)),
        eTime: parseTime(new Date()),
        ip: '',
        sort: 'UserID',
        sortType: 'UserID',
        minMoney: 0
      },
      downloadLoading: false,
      dialogStatus: ''
    }
  },
  created() {
    this.getList()
  },
  methods: {
    DateFormat(str) {
      return parseInt(str.substr(6, 13))
    },
    getList() {
      this.listLoading = true
      fetchList(this.listQuery).then(response => {
        this.list = response.data.Result
        this.total = response.data.MaxCount
        this.listLoading = false
      })
    },
    handleChange(value) {
      this.listQuery.minMoney = value
      this.handleFilter()
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    sortChange(data) {
      const { prop, order } = data
      this.sortByID(prop, order)
    },
    sortByID(column, order) {
      const type = { ascending: 0, descending: 1 }
      this.listQuery.sort = column
      this.listQuery.sortType = type[order]
      this.handleFilter()
    },
    handleDownload() {
      const diffTime = new Date(this.listQuery.eTime).getTime() - new Date(this.listQuery.bTime).getTime()
      const days = Math.floor(diffTime / (24 * 3600 * 1000))
      if (days > 30 * 3) {
        this.$message({
          showClose: true,
          message: '只能下载三个月之内的所有数据',
          type: 'warning'
        })
        return
      }
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = ['所在服务器IP', '所在服务器名称',
          '用户游戏ID', '手机号', '在线充值总额',
          '提现总额', '注册时间', '最后登录时间',
          '注册地址', '支付宝', '银行卡'
        ]
        const filterVal = ['IPAddress', 'GameName',
          'UserID', 'PhoneNumber', 'TotalRechargeLimit',
          'TotalWithdrawalLimit', 'RegisterTime', 'LastLogonTime',
          'RegisterIP', 'AlipayNumber', 'BankNumber']
        const AllQuery = {}
        Object.assign(AllQuery, this.listQuery)
        AllQuery.limit = this.total
        fetchList(AllQuery).then(response => {
          const Alldata = response.data.Result
          const data = this.formatJson(filterVal, Alldata)
          excel.export_json_to_excel({
            header: tHeader,
            data,
            filename: '数据中心-用户统计'
          })
          this.downloadLoading = false
        })
      })
    },
    formatJson(filterVal, jsonData) {
      const that = this
      console.log(that)
      return jsonData.map(v => filterVal.map(j => {
        if (j === 'RegisterTime' || j === 'LastLogonTime') {
          return parseTime(that.DateFormat(v[j]))
        } else {
          return v[j]
        }
      }))
    }
  }
}
</script>
