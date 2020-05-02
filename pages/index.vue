// v-data-table sort icon hydrate client side vs server side
<template>
  <div>
    <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      label="Search"
      single-line
      hide-details
      class="seachField mt-0 px-4"
    ></v-text-field>
    <v-data-table
      :height="tableHeight"
      :search="search"
      :headers="headers"
      :items="memos"
      class="elevation-1"
      hide-default-header
      hide-default-footer
      disable-pagination
      :custom-sort="sortNewFirst"
    >
      <template v-slot:item.memo="{ item }">
        <div class="py-1" @click="clickEdit(item)">
          <div
            :style="`width:${windowWidth - 32}px`"
            style="font-size:1.1em;overflow:hidden;white-space:nowrap;text-overflow:ellipsis"
          >
            {{ getFirstLine(item.memo) }}
          </div>

          <div
            :style="`width:${windowWidth - 32}px`"
            style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis"
          >
            <span class="mr-3" style="color:#8e8e8e">{{
              getDisplayDate(item.createdAt)
            }}</span
            ><span style="color:#707070">{{ getSecondLine(item.memo) }}</span>
          </div>
        </div>
      </template>
    </v-data-table>
    <v-dialog
      v-model="editMode"
      hide-overlay
      persistent
      transition="slide-x-reverse-transition"
      width="100%"
      class="ma-0 "
    >
      <v-flex class="pa-4 ma-0" style="background:#1e1e1e;height:100%">
        <textarea
          v-model="editedMemo.memo"
          autofocus
          class="textarea"
          style="width:100%;height:100%;font-weight: bolder;"
        />
      </v-flex>
    </v-dialog>

    <v-bottom-navigation
      ref="bottomNavigation"
      class="bottomNavigation"
      absolute
    >
      <v-btn
        v-if="editMode"
        value="recent"
        icon
        :ripple="false"
        @click="clickCancel"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="editMode && editedMemo.id"
        value="recent"
        icon
        :ripple="false"
        @click="clickDelete"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>

      <v-btn
        v-if="!editMode"
        value="recent"
        icon
        :ripple="false"
        @click.stop="clickNew"
      >
        <v-icon>mdi-file-plus</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script>
import Dexie from 'dexie'
export default {
  layout: 'memo',
  data: () => ({
    currentMemoEditCount: 0,
    windowWidth: 0,
    tableHeight: 0,
    timeoutId: undefined,
    editMode: false,
    search: '',
    db: {},
    memos: [],
    editedMemo: {
      memo: '',
      createdAt: ''
    },
    defaultMemo: {
      memo: '',
      createdAt: ''
    },
    headers: [{ text: '', value: 'memo' }]
  }),
  watch: {
    'editedMemo.memo'() {
      // 自動保存は1秒後に行う。1秒経過する前に、再入力があったら、タイマーをリセット
      if (this.editMode) {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId)
        }
        this.timeoutId = setTimeout(() => {
          this.save()
          this.timeoutId = undefined
        }, 1000)
      }
    },
    editMode(newEditMode) {
      if (!newEditMode) {
        this.editedMemo = { ...this.defaultMemo }
        if (this.timeoutId) {
          this.save()
          this.timeoutId = undefined
        }
      }
    }
  },
  async beforeMount() {
    this.db = new Dexie('memoDatabase')
    this.db.version(1).stores({ memo: '++id,memo,createdAt' })
    await this.setCUrrentDB()
  },
  mounted() {
    this.setTableHeight()
    this.setWindowWidth()
  },
  methods: {
    async clickNew() {
      await this.enableEditMode()
      await this.setFocus()
    },
    async clickEdit(item) {
      await this.setEditedMemo(item)
      await this.enableEditMode()
      await this.setFocus()
    },
    // 非同期にしたかった
    enableEditMode() {
      this.editMode = true
    },
    // 非同期にしたかった
    setEditedMemo(item) {
      this.editedMemo = { ...item }
    },
    // autofocusが一回目しか機能しないので自作した
    setFocus() {
      setTimeout(() => {
        const textarea = document.getElementsByClassName('textarea')[0]
        if (textarea) textarea.focus()
      }, 500)
    },
    async clickCancel() {
      if (!this.editedMemo.id) {
        this.editMode = false
        return false
      }
      const isBlank = this.editMode.memo === ''
      if (
        isBlank ||
        this.editedMemo.length > 1000 ||
        this.editedMemo.memo.replace(/(\r?\n|\r| |　)/gm, '') === '' // eslint-disable-line no-irregular-whitespace
      ) {
        await this.db.memo
          .where('id')
          .equals(this.editedMemo.id)
          .delete()
          .then()
        this.memos = this.memos.filter((item) => item.id !== this.editedMemo.id)
      }
      this.editMode = false
    },
    async clickDelete() {
      if (confirm('delete ?')) {
        if (this.editedMemo.id) {
          await this.db.memo
            .where('id')
            .equals(this.editedMemo.id)
            .delete()
            .then()
          this.memos = this.memos.filter(
            (item) => item.id !== this.editedMemo.id
          )
        }
        this.editMode = false
      }
    },
    async save() {
      this.editedMemo.createdAt = this.getCurrentDate('ymdhms')
      if (this.editedMemo.id) {
        await this.db.memo.update(this.editedMemo.id, this.editedMemo).then()
        this.memos = this.memos.map((memo) => {
          if (memo.id === this.editedMemo.id) return this.editedMemo
          return memo
        })
      } else {
        await this.db
          .transaction('rw', this.db.memo, async () => {
            const newItemId = await this.db.memo.add(this.editedMemo)
            this.editedMemo.id = newItemId
            this.memos.unshift(this.editedMemo)
          })
          .catch((e) => {
            alert(e.stack || e)
          })
      }
    },
    sortNewFirst(items) {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      return items
    },
    getCurrentDate(target) {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const day = now.getDate()
      const hour = now.getHours()
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()
      switch (target) {
        case 'ymd':
          return `${year}/${month}/${day}`
        case 'ymd-yesterday':
          return `${year}/${month}/${day - 1}`
        case 'ymd-before-yesterday':
          return `${year}/${month}/${day - 2}`
        case 'ymdhms':
          return `${year}/${month}/${day} ${hour}:${minutes}:${seconds}`
        case 'hm':
          return `${hour}:${minutes}`
      }
    },
    getDisplayDate(createdAt) {
      const currentYmd = this.getCurrentDate('ymd')
      const yesterDay = this.getCurrentDate('ymd-yesterday')
      const beforeYesterDay = this.getCurrentDate('ymd-before-yesterday')
      const hms = createdAt.split(' ')[1]
      const hm = `${hms.split(':')[0]}:${hms.split(':')[1]}`
      switch (createdAt.split(' ')[0]) {
        case currentYmd:
          return hm
        case yesterDay:
          return '昨日'
        case beforeYesterDay:
          return '一昨日'
        default:
          return createdAt.split(' ')[0]
      }
    },
    setTableHeight() {
      const windowHeight = document.documentElement.clientHeight
      const bottomNavigationHeight = document.getElementsByClassName(
        'bottomNavigation'
      )[0].offsetHeight
      const searchFieldHeight = document.getElementsByClassName('seachField')[0]
        .offsetHeight
      this.tableHeight =
        windowHeight - bottomNavigationHeight - searchFieldHeight
    },
    setWindowWidth() {
      this.windowWidth = document.documentElement.clientWidth
    },
    async setCUrrentDB() {
      await this.db
        .transaction('rw', this.db.memo, async () => {
          this.memos = await this.db.memo
            .where('id')
            .above(0)
            .toArray()
        })
        .catch((e) => {
          alert(e.stack || e)
        })
    },
    getFirstLine(memo) {
      if (!memo) return ''
      return memo.split('\n')[0]
    },
    getSecondLine(memo) {
      if (!memo) return ''
      const firstLine = this.getFirstLine(memo)
      return memo.replace(firstLine, '')
    }
  }
}
</script>

<style lang="scss">
div.v-dialog.v-dialog--active {
  margin: 0;
  height: calc(100vh - 56px) !important;
  max-height: 100%;
}
div.v-dialog {
  position: absolute;
  top: 0;
  box-shadow: none;
}

// chrome textarea border none
textarea {
  border: none;
  overflow: auto;
  outline: none;

  -webkit-box-shadow: none;
  -moz-box-shadow: none;
  box-shadow: none;

  resize: none; /*remove the resize handle on the bottom right*/
}

// https://github.com/vuetifyjs/vuetify/issues/8774
// hide data-table-header for mobile
.v-data-table__mobile-row__header {
  display: none;
}
.v-data-table__mobile-row__cell {
  text-align: left !important;
}
.v-data-table__mobile-row {
  padding: 0 16px !important;
}
</style>
