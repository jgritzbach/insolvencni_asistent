class VypoctySrazekManager{
    // třída slouží pro manipulaci s formuláři příjmů a vyživovaných osob
    // na jejich základě umí spočítat výše srážek proveditelných z příjmů
    // formuláře sám si jen pamatují, které kolonky jsou jejich, co se v nich může vyplňovat, a umí posoudit, co v nich je
    // vůbec se však nestarají o to, proč by to někdo chtěl vědět, a nejsou nijak iniciativní.
    // Pokyny k vyhodnocení jim zadává tento manžer, stejně tak jako vyvození důsledků takového vyhodnocení



    constructor(){

        // this.divVyhodnoceniFormulare = document.getElementById("div-vyhodnoceni-formulare")

        this.formularPrijmu = new FormularPrijmu()
        this.formularVyzivovacichPovinnosti = new FormularVyzivovacichPovinnosti()
        
        this.divVypocetSrazek = document.getElementById("div-vypocet-srazek")
        this._pridatUdalostVyhodnoceni()

    }


    _pridatUdalostVyhodnoceni(){
        // ke každé relevantní kolonce formuláře příjmů nebo vyživovacích povinností se přidá další change event listener.
        // právě ten zavolá přepočet srážek při jakékoliv změně

        const fPrijmy = this.formularPrijmu
        const fVyziv = this.formularVyzivovacichPovinnosti

        // Zde určíme, které kolonky jsou způsobilé vyvolat přepis textového výsledku
        const cile = [... fPrijmy.vsechnyKolonkyVysePrijmu, fPrijmy.kolonkaVyseDaru, fPrijmy.kolonkaTypDaru, ...fVyziv.vsechnyKolonky]      // přepis textu vyvolá i změna typu daru, protože jeho označení se pormítá do textu

        for (const kolonka of cile){
            kolonka.addEventListener('change', () => this._vypisVyhodnoceniPrijmu())
        }
    }

    _vypisVyhodnoceniPrijmu(){
        // Vypíše do patřičného divu údaje o výši nezabavitelné částky, výši srážek a zapodstatových pohledávek
        this.divVypocetSrazek.innerHTML = this._sestavTextProVyhodnoceniPrijmu()
    }

    _sestavTextProVyhodnoceniPrijmu(){
        // sestaví a vrátí text, který je určený k průpisu do patřičného divu
        // k samotným výpočtům používá nezávislý nástroj výpočtu srážek

        const p = this.formularPrijmu
        const v = this.formularVyzivovacichPovinnosti

        const prijmy = p.getSoucetPrijmu()
        const osoby = v.pocetOsob()
        const srazka = vypocetSrazek.vypocitatSrazku(prijmy, osoby)     // díky uložení výše srážky do mezivýpočtu ušetříme jeden výpočet navíc - výpočet srážek provádí samostatná třída (nástroj)
        const zustatek = prijmy - srazka

        const prijmyZDaru = p.getPrijemOdTretiOsoby()
        const celkovaSrazka = srazka + prijmyZDaru

        const pausalIS = 1089       // odměna a hotové výdaje insolvenčního správce vč. DPH

        //text popisu zůstatku pro dlužníka
        let text = `<p>Dlužníku z vlastních příjmů měsíčně zůstane ${zustatek} Kč.</p>`

        // text popisu výše srážek z vlastních příjmů
        text += `<p>Z vlastních příjmů dlužníka lze provést srážku: ${srazka} Kč.</p>`
                      
        // text obohatíme o popis příjmů z daru, je-li nějaký
        if (prijmyZDaru){

            let typPrijmuOdTretiOsoby = p.getTypPrijmuOdTretiOsoby()
            typPrijmuOdTretiOsoby = typPrijmuOdTretiOsoby? typPrijmuOdTretiOsoby : `smlouva se třetí osobou`
            let popisDaru = `, který dlužníku zajišťuje uzavřená ${typPrijmuOdTretiOsoby},`

            text += `<p>Příjem ve výši ${prijmyZDaru} Kč${popisDaru} je dlužník povinnen vydat celý (nezkrácený) ve prospěch majetkové podstaty.</p>`
        }

        // je-li z vlastních příjmů prováděna srážka a ještě k tomu má dlužník dar, zrekapitulujeme ještě jejich součet, ať je v tom jasno
        if (srazka && prijmyZDaru){    
            text += `<p>Celkem tak dlužník do majetkové podstaty odevzdá ${celkovaSrazka} Kč měsíčně.</p>`
        }

        // je celková proveditelná srážka vůbec větší, než je měsíční paušál IS?
        const popisPausaluIS = `měsíční paušál insolvenčního správce (záloha na jeho odměnu a hotové výdaje), jenž činí v případě dlužníka jednotlivce ${pausalIS} Kč vč. DPH, a který je třeba hradit přednostně.`

        if (celkovaSrazka > pausalIS){  // Pokud pokryjeme alespoň paušál IS
            text += `<p>Od této částky je třeba dále odečíst ${popisPausaluIS}</p>` // připíšeme to do textu a normálně pokračujeme dál
        } else {    // pokud však nepokryjeme ani paušál IS
            text += `<p>Tato částka nepokryje ani ${popisPausaluIS}<p>      
                     <p>Neprokáže-li dlužník soudu další příjmy, oddlužení nebude povoleno pro nesplnění podmínky minimální splátky.</p>` // připíšeme to do textu

            return text // a rovnou skončíme - nic dalšího už není potřeba vypisovat
        }

        // má-li dlužník dlužné výživné, text popisu to zmíní
        if (v.dluzneVyzivne()){
            text += `<p>Dále se bude uspokojovat přednostně dlužné výživné, a to až do úplného splacení dlužné částky ${v.dluzneVyzivne()} Kč.</p>`
        }

        if (v.mesicniVyzivne()){
            text += `<p>Dále je třeba odečíst pravidelné měsíční výživné určené soudem ve výši ${v.mesicniVyzivne()} Kč.</p>`
        }

        text += `<p>Teprve poté je možné uspokojovat nezajištěné věřitele.</p>`

        // text máme hotový, můžeme vrátit
        return text
    }
}