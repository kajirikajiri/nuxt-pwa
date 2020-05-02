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
      :items="desserts"
      :items-per-page="5"
      class="elevation-1"
      hide-default-header
      hide-default-footer
      disable-pagination
      :custom-sort="customSort"
    >
      <template v-slot:item.memo="{ item }">
        <div class="py-1" @click="editItem(item)">
          <div
            :style="`width:${windowWidth - 32}px`"
            style="font-size:1.1em;overflow:hidden;white-space:nowrap;text-overflow:ellipsis"
          >
            {{ firstLine(item.memo) }}
          </div>

          <div
            :style="`width:${windowWidth - 32}px`"
            style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis"
          >
            <span class="mr-3" style="color:#8e8e8e">{{
              fixDate(item.createdAt)
            }}</span
            ><span style="color:#707070">{{ secondLine(item.memo) }}</span>
          </div>
        </div>
      </template>
    </v-data-table>
    <v-dialog
      v-model="dialog"
      hide-overlay
      persistent
      transition="slide-x-reverse-transition"
      width="100%"
      class="ma-0 "
    >
      <v-flex class="pa-4 ma-0" style="background:#1e1e1e;height:100%">
        <textarea
          ref="textareaFirst"
          v-model="editedMemo.memo"
          autofocus
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
        v-if="inputMode && editedIndex !== -1"
        value="recent"
        icon
        :ripple="false"
        @click="cancelEdit"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="inputMode"
        value="recent"
        icon
        :ripple="false"
        @click="deleteCurrentMemo"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>

      <v-btn
        v-if="editedMemo.memo.length === 0"
        value="recent"
        icon
        :ripple="false"
        :disabled="inputMode"
        @click.stop="clickNewMemo"
      >
        <v-icon>mdi-file-plus</v-icon>
      </v-btn>
      <v-btn v-else value="recent" icon :ripple="false" @click="save">
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script>
import Dexie from 'dexie'
export default {
  layout: 'memo',
  data: () => ({
    windowWidth: 0,
    tableHeight: 0,
    inputMode: false,
    search: '',
    db: {},
    editedIndex: -1,
    desserts: [],
    editedMemo: {
      memo: '',
      createdAt: ''
    },
    defaultMemo: {
      memo: '',
      createdAt: ''
    },
    dialog: false,
    headers: [{ text: '', value: 'memo' }]
  }),

  async mounted() {
    this.db = new Dexie('todoDatabase')
    this.db.version(1).stores({ todo: '++id,memo,createdAt' })

    await this.db
      .transaction('rw', this.db.todo, async () => {
        // Query:
        this.desserts = await this.db.todo
          .where('id')
          .above(0)
          .toArray()
      })
      .catch((e) => {
        alert(e.stack || e)
      })

    const windowHeight = document.documentElement.clientHeight
    const bottomNavigationHeight = document.getElementsByClassName(
      'bottomNavigation'
    )[0].offsetHeight
    const searchFieldHeight = document.getElementsByClassName('seachField')[0]
      .offsetHeight
    this.tableHeight = windowHeight - bottomNavigationHeight - searchFieldHeight

    this.windowWidth = document.documentElement.clientWidth
  },

  methods: {
    customSort(items) {
      // console.log(items)
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      return items
    },
    fixDate(createdAt) {
      const ymd = Date.parse(createdAt.split(' ')[0])
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const day = now.getDate()
      const currentYmd = Date.parse(`${year}/${month}/${day}`)
      const yesterDay = Date.parse(`${year}/${month}/${day - 1}`)
      // console.log(ymd)
      switch (ymd) {
        case currentYmd:
          return '今日'
        case yesterDay:
          return '昨日'
        default:
          return createdAt.split(' ')[0]
      }
    },
    firstLine(memo) {
      if (!memo) return ''
      return memo.split('\n')[0]
    },
    secondLine(memo) {
      if (!memo) return ''
      const firstLine = this.firstLine(memo)
      return memo.replace(firstLine + '\n', '')
    },
    clickNewMemo() {
      this.inputMode = true
      this.dialog = true
    },
    editItem(item) {
      this.editedIndex = this.desserts.indexOf(item)
      this.editedMemo = Object.assign({}, item)
      this.dialog = true
      this.inputMode = true
    },

    async save() {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const day = now.getDate()
      const hour = now.getHours()
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()
      const createdAt = `${year}/${month}/${day} ${hour}:${minutes}:${seconds}`

      this.editedMemo.createdAt = createdAt
      // const maxId = this.desserts.map(a=>a.id).reduce((a,b) => {
      //   return Math.max(a,b)
      // })
      // this.editedMemo.id = maxId + 1
      this.desserts.unshift(this.editedMemo)
      if (this.editedIndex === -1) {
        await this.db
          .transaction('rw', this.db.todo, async () => {
            await this.db.todo.add(this.editedMemo)
          })
          .catch((e) => {
            alert(e.stack || e)
          })
      } else {
        this.db.todo.update(this.editedMemo.id, this.editedMemo).then()
      }
      await this.db
        .transaction('rw', this.db.todo, async () => {
          // Query:
          this.desserts = await this.db.todo
            .where('id')
            .above(0)
            .toArray()
        })
        .catch((e) => {
          alert(e.stack || e)
        })
      this.dialog = false
      this.editedIndex = -1
      this.inputMode = false
      this.editedMemo = { ...this.defaultMemo }
    },
    // 自動保存にすれば。キャンセルはいらない
    cancelEdit() {
      if (confirm('Are you sure you want to cancel edit?')) {
        this.editedIndex = -1
        this.editedMemo = { ...this.defaultMemo }
        this.dialog = false
        this.inputMode = false
      }
    },
    deleteCurrentMemo() {
      if (confirm('Are you sure you want to delete this item?')) {
        if (this.editedIndex === -1) {
          this.editedMemo = { ...this.defaultMemo }
          this.dialog = false
          this.inputMode = false
        } else {
          const deleteItem = this.desserts.find((item) => {
            if (this.editedMemo.id === item.id) {
              // console.log(item, item.id, this.editedMemo.id)
              return true
            }
          })
          this.editedIndex = -1
          this.editedMemo = { ...this.defaultMemo }
          this.dialog = false
          this.inputMode = false
          this.desserts = this.desserts.filter(
            (item) => item.id !== deleteItem.id
          )
          this.db.todo
            .where('id')
            .equals(deleteItem.id)
            .delete()
            .then(function(_) {})
        }
      }
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
