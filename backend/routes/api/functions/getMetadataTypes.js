function getMetadataTypes(){

    return [

        {
            "label":"Custom Field",
            "value":"CustomField"
         },
         {
            "label":"Standard Field",
            "value":"StandardField"
         },

         {
            "label":"Objects & Custom Settings/Metadata Types",
            "value":"CustomObject"
            
         },
         {
            "label":"Standard Objects",
            "value":"CustomObject"
         },

        {
            "label":"Page Layout",
            "value":"Layout"
         },
         
        {
            "label":"Custom Button",
            "value":"WebLink"
         },
         
         {
            "label":"Field Set",
            "value":"FieldSet"
         },

        {
            "label":"Apex Trigger",
            "value":"ApexTrigger"
        },

        {
            label:'Apex Class',
            value:'ApexClass'
        },
        {
            "label":"Visualforce Page",
            "value":"ApexPage"
         },
         {
            "label":"Visualforce Component",
            "value":"ApexComponent"
         },
         
         {
            "label":"Custom Label",
            "value":"CustomLabel"
         },
         {
            "label":"Validation Rule",
            "value":"ValidationRule"
         },
         {
            "label":"Flow / Process",
            "value":"Flow"
         },
         {
            "label":"Email Template",
            "value":"EmailTemplate"
         },
         {
            "label":"Email Alert",
            "value":"WorkflowAlert"
         },
         {
            "label":"Lightning Component (Aura)",
            "value":"AuraDefinitionBundle"
         }
    ];
}

module.exports = getMetadataTypes;