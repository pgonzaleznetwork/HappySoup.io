<template>
    <section v-if="data && !data.error">
        <p><span class="font-weight-500">Total number of {{data.object}} records in the org: </span>{{data.totalRecords.toLocaleString()}}</p>
        <p><span class="font-weight-500">Total number of {{data.object}} records with a value on this field: </span>{{data.totalRecordsPopulated.toLocaleString()}}</p>
        <p><span class="font-weight-500">Percentage Populated: </span>{{data.percentagePopulated}}%</p>

        <section v-if="data.mostRecentRecord">
            <br>
            <p> <a :href="data.mostRecentRecord.createdByUrl" target="_blank"> {{data.mostRecentRecord.createdByName}} </a> created
            the <a :href="data.mostRecentRecord.recordUrl" target="_blank">most recent record </a> that
            has a value on this field. The value is <b>{{data.mostRecentRecord.fieldValue}}</b> and the record was created 
            on <b>{{data.mostRecentRecord.createdDate}}</b>. This might be a good person to ask questions about this field. </p>
        </section>

        <section v-if="data.note">
            <br>
            <p>{{data.note}}</p>
        </section>

    </section>
</template>

<script>
export default {

    props:['data']

}
</script>

<style>

</style>