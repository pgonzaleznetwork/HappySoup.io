<template>
    <div>
        <DataTable :value="source.data" :paginator="true" class="p-datatable-metadata p-datatable-sm" :rows="50"
            dataKey="id" :rowHover="true" v-model:filters="filters" filterDisplay="menu" :loading="loading"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" :rowsPerPageOptions="[10,25,50,100]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            responsiveLayout="scroll"
            >
            <template #header>
                 <div class="p-d-flex p-jc-between p-ai-center">
                    <h3 class="p-m-0">{{title}}</h3>
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
                    </span>
                 </div>
            </template>
            <template #empty>
                No metadata found
            </template>
            <template #loading>
               
            </template>

            <Column v-for="col in source.columns" :field="col.field" :header="col.header" :key="col.field"  style="min-width: 14rem">
            
                <template #body="{data}">

                    <a v-if="col.field == 'name'" :href="data['url']" target="_blank" > {{data[col.field]}}</a>
                    <Pill v-else-if="col.field == 'attributes'" v-for="pill in data.pills" :pill="pill"/>
                    <span v-else>{{data[col.field]}}</span>

                </template>
            </Column>

        </DataTable>
	</div>
</template>

<script>
import { ref, onMounted } from "vue";
import { FilterMatchMode, FilterOperator } from "primevue/api";
import {PrimeIcons} from 'primevue/api';
import Pill from '@/components/ui/Pill.vue'

export default {

    components:{Pill},

    props:['source','title'],

    data(){
        return{
            filters : {global: { value: null, matchMode: FilterMatchMode.CONTAINS }},
            loading:false
        }
    }
};

</script>

<style lang="scss" scoped>

.p-datatable-metadata{
     @extend .text-size;
}


img {
    vertical-align: middle;
}
::v-deep(.p-paginator) {
    .p-paginator-current {
        margin-left: auto;
    }
}

::v-deep(.p-progressbar) {
    height: .5rem;
    background-color: #D8DADC;

    .p-progressbar-value {
        background-color: #607D8B;
    }
}

::v-deep(.p-datepicker) {
    min-width: 25rem;

    td {
        font-weight: 400;
    }
}

::v-deep(.p-datatable.p-datatable-metadata) {
    .p-datatable-header {
        padding: 1rem;
        text-align: left;
       
    }

    .p-paginator {
        padding: 1rem;
    }

    .p-datatable-thead > tr > th {
        text-align: left;
    }

    .p-datatable-tbody > tr > td {
        cursor: auto;
    }

    .p-dropdown-label:not(.p-placeholder) {
        text-transform: uppercase;
    }
}
</style>