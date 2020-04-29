// v-data-table sort icon hydrate client side vs server side
<template>
  <client-only>
    <v-data-table
      :headers="headers"
      :items="desserts"
      sort-by="calories"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-toolbar-title>My CRUD</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ on }">
              <v-btn color="primary" dark class="mb-2" v-on="on"
                >New Item</v-btn
              >
            </template>
            <v-card>
              <v-card-title>
                <span class="headline">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" sm="6" md="4">
                      <v-text-field
                        v-model="editedItem.title"
                        label="title"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                      <v-text-field
                        v-model="editedItem.memo"
                        label="memo"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="close">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="save">Save</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon small class="mr-2" @click="editItem(item)">
          mdi-pencil
        </v-icon>
        <v-icon small @click="deleteItem(item)">
          mdi-delete
        </v-icon>
      </template>
    </v-data-table>
  </client-only>
</template>

<script>
import Dexie from 'dexie'
export default {
  data: () => ({
    db: {},
    dialog: false,
    headers: [
      {
        text: 'title',
        align: 'start',
        value: 'title'
      },
      { text: 'memo', value: 'memo' },
      { text: 'Actions', value: 'actions', sortable: false }
    ],
    desserts: [],
    editedIndex: -1,
    editedItem: {
      title: '',
      memo: ''
    },
    defaultItem: {
      title: '',
      memo: ''
    }
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
    }
  },

  watch: {
    dialog(val) {
      val || this.close()
    }
  },
  mounted() {
    this.db = new Dexie('todoDatabase')
    this.db.version(1).stores({ todo: '++id,title,memo' })

    this.db
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
  },

  methods: {
    editItem(item) {
      this.editedIndex = this.desserts.indexOf(item)
      this.editedItem = Object.assign({}, item)
      this.dialog = true
    },

    deleteItem(item) {
      const index = this.desserts.indexOf(item)
      if (confirm('Are you sure you want to delete this item?')) {
        this.desserts.splice(index, 1)
        this.db.todo
          .where('id')
          .equals(item.id)
          .delete()
          .then(function(_) {})
      }
    },

    close() {
      this.dialog = false
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      }, 300)
    },

    save() {
      if (this.editedIndex > -1) {
        // update
        Object.assign(this.desserts[this.editedIndex], this.editedItem)
        this.db.todo
          .update(this.editedItem.id, this.editedItem)
          .then(function(updated) {
            if (updated) {
              // updated
            } else {
              // missing
            }
          })
      } else {
        // new
        this.desserts.push(this.editedItem)
        this.db
          .transaction('rw', this.db.todo, async () => {
            await this.db.todo.add(this.editedItem)
          })
          .catch((e) => {
            alert(e.stack || e)
          })
      }
      this.close()
    }
  }
}
</script>
