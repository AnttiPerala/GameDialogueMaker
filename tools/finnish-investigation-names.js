function finnishInvestigationNames(project) {
    // Explicit Finnish inflections: a stem-only replacement would produce e.g.
    // "Sannailla" or "Riikkayan" in the spoken dialogue.
    const names = {
        Daniel:'Timo', Danielia:'Timoa', Danielin:'Timon',
        Voss:'Laine', Vossia:'Lainetta', Vossista:'Laineesta',
        Leah:'Sanna', Leahia:'Sannaa', Leahilla:'Sannalla', Leahin:'Sannan', Leahista:'Sannasta',
        Mercer:'Niemi', 'Merceriä':'Niemeä', 'Merceristä':'Niemestä',
        Morgan:'Mikko Salmi', Morganin:'Mikko Salmen', Morganista:'Mikko Salmesta',
        Priya:'Riikka', Priyaa:'Riikkaa', Priyaan:'Riikkaan', Priyalta:'Riikalta', Priyan:'Riikan', Shah:'Korhonen',
        DANIEL:'TIMO', LEAH:'SANNA'
    };
    const visit = value => {
        if (typeof value === 'string') return value.replace(/[A-Za-zÄÖÅäöå]+/g, word=>names[word] || word);
        if (Array.isArray(value)) return value.map(visit);
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,visit(item)]));
        return value;
    };
    const localized = visit(project);
    localized.caseNotes.setting = 'Kuvitteellinen tapaus suomalaisilla henkilönnimillä. Alkuperäinen teatteriympäristö ja rahasummat on säilytetty. Menettelyjä ei ole sidottu tietyn maan lainsäädäntöön.';
    return localized;
}
module.exports = {finnishInvestigationNames};
