import prisma from '../utils/prisma';

const rawData = [
  { sno: 1, name: "GOVIND A MORE PATIL", phone: "9902846498" },
  { sno: 2, name: "MANISHA V V MORE PUMP", phone: "9880059673" },
  { sno: 3, name: "BALAJI TAGLOOR", phone: "9448716135" },
  { sno: 4, name: "SANVI BALAJI SINGNALE", phone: "9611537643" },
  { sno: 5, name: "SHIVRAJ R MULGE BOLEGAON", phone: null },
  { sno: 6, name: "URMILA BIRADAR HYD", phone: "7036017617" },
  { sno: 7, name: "VAISHNAVI GOVIND U BIRADAR HYD", phone: "7036017617" },
  { sno: 8, name: "BHARAT VITTHAL ROA D SAMJE", phone: "7337423821" },
  { sno: 9, name: "DEEPAK U MALKAPURE", phone: null },
  { sno: 10, name: "RAGINI TANAJI JAMKHANDE", phone: null },
  { sno: 11, name: "POONAM BALAJI MORE", phone: "9964546837" },
  { sno: 12, name: "RUPAVATI BALAJI MORE C/O S V MORE", phone: "9730969083" },
  { sno: 13, name: "SONALI TUKADE PUNE", phone: "9673211133" },
  { sno: 14, name: "NAGNATH BABURAO GAVLI", phone: "9902812514" },
  { sno: 15, name: "VIJAYABAI BHALKE", phone: "9980537730" },
  { sno: 16, name: "DINESH BIRADAR BHALKE PUNE", phone: "8766022135" },
  { sno: 17, name: "RAVINDRA NASKE", phone: "9902070501" },
  { sno: 18, name: "HEERABAI RAJKUMAR PATIL HANGARGA", phone: "9108774398" },
  { sno: 19, name: "ANITA SANJAY WAGGE PUNE", phone: "9108774398" },
  { sno: 20, name: "KRISHANA BALAJI MEHTRE BOLEGAON", phone: "7447257178" },
  { sno: 21, name: "KOMAL RAJU GAROLE", phone: null },
  { sno: 22, name: "MAMTA GUNDU S MORE", phone: null },
  { sno: 23, name: "GNANESHWAR ABHANGRAO MORE HYD", phone: null },
  { sno: 24, name: "SUBHASH DAYANAND BULLA BOLEGAON", phone: "8217809723" },
  { sno: 25, name: "BALIRAM MALKAPURE", phone: "9901398090" },
  { sno: 26, name: "SAIDEEP BALASAHEB MORE BIDAR", phone: null },
  { sno: 27, name: "SRUSHTI BALASAHEB MORE BIDAR", phone: null },
  { sno: 28, name: "SHARNAPPA BASAVRAJ NASKE", phone: "9902070501" },
  { sno: 29, name: "ARCHANA KALYANRAO MEHTRE", phone: "8904773514" },
  { sno: 30, name: "GUNDAJI GAJRE TUGAON", phone: "6360860055" },
  { sno: 31, name: "SHILPA RODE C/O DATTA SIR MEH", phone: "9880737619" },
  { sno: 32, name: "LATA NELWADKAR C/O DATTA SIRN MEH", phone: "9880737619" },
  { sno: 33, name: "SRIDHAR MADHAV RAO MORE", phone: null },
  { sno: 34, name: "RAJESH SRIDHAR MORE", phone: null },
  { sno: 35, name: "AVADUTH HARI WAGHMODE", phone: "9972353892" },
  { sno: 36, name: "ASHWINI RAMRATAN KANDGULE", phone: "9665839249" },
  { sno: 37, name: "SINDHANT DATTA BIRADAR BHALKI", phone: null },
  { sno: 38, name: "MEGHA DATTA BIRADAR BHALKI", phone: null },
  { sno: 39, name: "BALAJI P SHINDE SIR SAMBHAJI SCHOOL", phone: "9743136867" },
  { sno: 40, name: "RAJSHREE SRIDHAR MORE PUNE", phone: "9403248646" },
  { sno: 41, name: "SANGITA SRIDHAR MORE", phone: "9403248646" },
  { sno: 42, name: "VEDANT BIRADAR LATUR C/O SRIDHAR MORE", phone: "9403248646" },
  { sno: 43, name: "DATTA DAPKE MANKESHWAR", phone: "6363986841" },
  { sno: 44, name: "TANMAY ARVIND MORE MORE JEWELLERS", phone: "8019574096" },
  { sno: 45, name: "UDDHAVRAO MALKAPURE", phone: null },
  { sno: 46, name: "BAJRANG BORATE", phone: "9686965787" },
  { sno: 47, name: "BRAMHA BORATE MANKESHAE", phone: "9686965787" },
  { sno: 48, name: "SOMNATH SONPE SRIMALI PUMP", phone: "9611267231" },
  { sno: 49, name: "PARMESHWAR BARDALE", phone: "7204901432" },
  { sno: 50, name: "LAITHA MADHUKAR KARBHARI KHATPATE", phone: null },
  { sno: 51, name: "POOJA BRAHMAJI KHATPATE", phone: null },
  { sno: 52, name: "PRAMOD S HILALPURE", phone: null },
  { sno: 53, name: "PRAMOD S HILALPURE 2", phone: null },
  { sno: 54, name: "PRAMOD S HILALPURE 3", phone: null },
  { sno: 55, name: "PRAMOD S HILALPURE 4", phone: null },
  { sno: 56, name: "BALAJI TAGLOOR 2", phone: null },
  { sno: 57, name: "RADHIKA D SAMJE HYD", phone: "6300281760" },
  { sno: 58, name: "SACHIN KUMAR NELWADKAR", phone: null },
  { sno: 59, name: "SANDEEP KUMAR NELWADKAR", phone: null },
  { sno: 60, name: "AKASH PRAKASHROA YAKURKE", phone: "7620705919" },
  { sno: 61, name: "ASHISH PRAKASHROA YAKURKE", phone: "7620705916" },
  { sno: 62, name: "SHILPA MANE MUMBAI C/O S V MORE", phone: "7625089781" },
  { sno: 63, name: "SIDDU VAIJU MORE SAI PRINTER", phone: "9611789214" },
  { sno: 64, name: "KIRAN MALCHIMANE SRIMALI", phone: "8007617414" },
  { sno: 65, name: "RAGINI SANTOSH CHAFEKAR", phone: null },
  { sno: 66, name: "SHESHANATH VENKAT HASURE", phone: "6281218824" },
  { sno: 67, name: "PRAVEEN BALAJI MORE C/O S V MORE", phone: null },
  { sno: 68, name: "REKHA BAI DATTA BIRADAR SIR MEH", phone: "9164051566" },
  { sno: 69, name: "SANDEEP ANKUSH CHAFEKAR", phone: "8123257731" },
  { sno: 70, name: "SRINIVAS PAWAR LATUR C/O RAJU MANE", phone: "9420826117" },
  { sno: 71, name: "JAYA SINDUJA C/O RAJU MANE", phone: "799565905" },
  { sno: 72, name: "SUDHEER KUDPANE", phone: "8374190318" },
  { sno: 73, name: "KANAYA SUDHEER KUDPANE", phone: "8374190318" },
  { sno: 74, name: "MANAS MAHESH HADOLE", phone: null },
  { sno: 75, name: "GUNDAPPA AINAPURE MEH", phone: "7794032965" },
  { sno: 76, name: "SUNITA RAJU BHALKE C/O ANK CHAFEKAR", phone: "8310510322" },
  { sno: 77, name: "BALAJI TAGLOOR 3", phone: "9448716135" },
  { sno: 78, name: "GOPAL RAJARAM MANKESHWAR", phone: "9632414390" },
  { sno: 79, name: "MIRA JYOTI RAM PAWAR MEH", phone: "9148187817" },
  { sno: 80, name: "SANTOSH DEEPALI MEHTRE C/O D MEHTRE", phone: "9890380240" },
  { sno: 81, name: "SRIHARI BIRADAR LATUR", phone: "88885752239" },
  { sno: 82, name: "PAVAN K SHIVARE", phone: "8904357516" },
  { sno: 83, name: "SNEHA PREMAJI MORE", phone: "7676825552" },
  { sno: 84, name: "SUNITA ANKUSH CHAFEKAR", phone: "7411437731" },
  { sno: 85, name: "BALIKA PAWAR LATUR", phone: "8459894808" },
  { sno: 86, name: "BHARATHA BAI PANDURANG KADAM", phone: "9113087060" },
  { sno: 87, name: "MAYURI SATYAWAN BHALKE C/O MANKESHARE", phone: "7026709755" },
  { sno: 88, name: "RANJEET MAHADEV KUMBHAR", phone: null },
  { sno: 89, name: "KISHOR SHESHERAO INDRALE B WADI", phone: null },
  { sno: 90, name: "JYOTI KISHORE INDRALE", phone: null },
  { sno: 91, name: "SHIVAJI WAGHMODE MEH", phone: "9900894089" },
  { sno: 92, name: "SUPRIYA S NELWADKAR", phone: "9845008746" },
  { sno: 93, name: "VEDANSHI V CHINCHOLE", phone: "9164051566" },
  { sno: 94, name: "BALAJI TAGLOOR 4", phone: null },
  { sno: 95, name: "DAKSH SHIVAJI WARNALE", phone: null },
  { sno: 96, name: "MAHESH SHANKAR RAO PANCHAL", phone: "7618727516" },
  { sno: 97, name: "NARSING D POCHE", phone: "7975658718" },
  { sno: 98, name: "NARAYAN KAMBLE", phone: "9881612385" },
  { sno: 99, name: "RADHIKA SURYAWANSI GANESH KARAGIR", phone: "6363654531" },
  { sno: 100, name: "GANESH SHARWALE HYD", phone: null },
  { sno: 101, name: "V V MORE PUMP", phone: null },
  { sno: 102, name: "SHRISTI VITHAL MORE PUMP", phone: null },
  { sno: 103, name: "SAMRATH VITHAL MORE PUMP", phone: null },
  { sno: 104, name: "RUDRA SANTOSH MORE PATIL MEH", phone: "7259634642" },
  { sno: 105, name: "CHINTU AMBADAS KAMBLE PAN SHOP", phone: "7219072703" },
  { sno: 106, name: "ANVIT DATTA SABNE MEH", phone: "8951361343" },
  { sno: 107, name: "ADVIK BALAJI SABNE", phone: null },
  { sno: 108, name: "RUPALI DATTA SABNE", phone: null },
  { sno: 109, name: "AARTI BALAJI SABNE", phone: null },
  { sno: 110, name: "RAHIM FARID SAIKH", phone: "9008146748" },
  { sno: 111, name: "SANGMESH RACHANA MEHTRE PUMP", phone: "9342145229" },
  { sno: 112, name: "SHIVAJI KAKA BOLEGOAN", phone: null },
  { sno: 113, name: "MAHESH HADOLE", phone: null },
  { sno: 114, name: "MUKESH HADOLE", phone: null },
  { sno: 115, name: "YOGESH HADOLE", phone: null },
  { sno: 116, name: "KRISHANA YASHWANTH JADHAV KHATPATE", phone: null },
  { sno: 117, name: "YASHAWANTH JADHAV MEH KHATPATE", phone: null },
  { sno: 118, name: "NIVAS YEKURKE", phone: null },
  { sno: 119, name: "SUDHARANI YEKURKE", phone: null },
  { sno: 120, name: "SHIVKANYA KIRAN MALCHIMANE SRIMALI", phone: "8007617414" },
  { sno: 121, name: "POOJA BALIRAM MALKAPURE", phone: "9901398090" },
  { sno: 122, name: "PRASHANT VENKAT MEHTRE B KALYAN", phone: null },
  { sno: 123, name: "AMBIKA SANJEEV JADGE", phone: "7353801061" },
  { sno: 124, name: "KARTIK BALAJI SINGNALE", phone: "9611537643" },
  { sno: 125, name: "SUMIT SANTOSH CHAFEKAR MEH", phone: "9980282716" },
  { sno: 126, name: "CHANDRASHEKHAR S MOLKIRE", phone: "9513863099" },
  { sno: 127, name: "VINOD MADHAVRAO MORE DUBAI", phone: "9561496799" },
  { sno: 128, name: "SHANKAR VITHAL RAO JADHAV", phone: "8494856469" },
  { sno: 129, name: "SATYABHAMA DNY HALSE", phone: null },
  { sno: 130, name: "RADHIKA DNY HALSE", phone: null },
  { sno: 131, name: "AMBIKA DNY HALSE", phone: null },
  { sno: 132, name: "DNY HALSE", phone: null },
  { sno: 133, name: "KAMLA BAI UPPAL HYD SAKHU", phone: null },
  { sno: 134, name: "OMKAR WINE SHOP", phone: null },
  { sno: 135, name: "RAVINDAR BASVANT APPA PATIL WINE", phone: "9902222696" },
  { sno: 136, name: "BANSHI DATTA LONE", phone: null },
  { sno: 137, name: "TRUPTHI RAJU MANE", phone: null },
  { sno: 138, name: "RAJU MANE HYD", phone: null },
  { sno: 139, name: "RAJASHREE KAILASH ROLE", phone: null },
  { sno: 140, name: "KAILASH ROLE", phone: null },
  { sno: 141, name: "DEVASHREE KAILASH ROLE", phone: null },
  { sno: 142, name: "ADITI KAILASH ROLE MEH", phone: null },
  { sno: 143, name: "BHAGYASHREE ARVIND MORE JEWELLERS", phone: "6281218824" },
  { sno: 144, name: "SANVI NAVNATH PATIL", phone: null },
  { sno: 145, name: "MAYURI SURYAWANSI GANESH KARAGIR", phone: "6363654531" },
  { sno: 146, name: "OM HOTEL TEA", phone: null },
  { sno: 147, name: "MALLIKARAJUN KASHAPA NASKE C/O R.MORE", phone: "8747998280" },
  { sno: 148, name: "RUPESH RAJENDER MORE", phone: "6360241527" },
  { sno: 149, name: "NAMDEV MADHU KUMBHAR SRIMALI", phone: "9545421007" },
  { sno: 150, name: "DATTATRI TAMBOLE C/O S V MORE", phone: "9353780366" },
  { sno: 151, name: "SRIDHAR PANDURANG KADAM", phone: "9113087060" },
  { sno: 152, name: "ANJALI JADHAV C/O S V MORE", phone: "9920835438" },
  { sno: 153, name: "DARSHU JADHAV C/O S V MORE", phone: "9920835438" },
  { sno: 154, name: "GANESH MANKARE C/O S V MORE", phone: "9945084171" },
  { sno: 155, name: "MUNAWAR SHAIKH C/O S V MORE", phone: "9004835754" },
  { sno: 156, name: "MD ZAID C/O S V MORE", phone: "9004835754" },
  { sno: 157, name: "PAYAL JADHAV C/O S V MORE", phone: "9987366615" },
  { sno: 158, name: "ULLAS KAMBLE MEH", phone: "9901583548" },
  { sno: 159, name: "VIJAY SALUNKE MUNNA", phone: "8149149629" },
  { sno: 160, name: "VISHAKHA BAIS NANDED C/O VIJAY SALUNKE", phone: "7722093920" },
  { sno: 161, name: "USHA PATIL JAWALGA", phone: null },
  { sno: 162, name: "POOJA PRABHAKAR BIRADAR PUNE C/O S V MORE", phone: null },
  { sno: 163, name: "PRABHAKAR VITHAL RAO MORE C/O S V MORE", phone: null },
  { sno: 164, name: "BALAJI VITHAL MORE C/O S V MORE", phone: null },
  { sno: 165, name: "BHARATH BAI VITHAL RAO MORE C/O S V MORE", phone: null },
  { sno: 166, name: "AJIT PRABHAKAR MORE C/O S V MORE", phone: null },
  { sno: 167, name: "DEEPA SATISH MORE C/O S V MORE", phone: null },
  { sno: 168, name: "PAWAN BALAJI MORE C/O S V MORE", phone: null },
  { sno: 169, name: "LAXMI SATISH MORE C/O S V MORE", phone: null },
  { sno: 170, name: "MEGHA RANI CHAVAN C/O S V MORE", phone: null },
  { sno: 171, name: "NITEEN PRABHAKAR BIRADAR BOLEGAON", phone: null },
  { sno: 172, name: "BRAMHAJI KHATPATE [R]", phone: null },
  { sno: 173, name: "MADHUMATI SATISH SURYANSHI", phone: "9743352287" },
  { sno: 174, name: "DHANSHREE V CHAUDHARIC/0 SAVRE SIR", phone: "9880791663" },
  { sno: 175, name: "VAISHNAVI INGLE ATHARGA C/O GUNDUMORE", phone: "9850868189" },
  { sno: 176, name: "KHANDU SHESHERAO SHIVARE", phone: "9900249597" },
  { sno: 177, name: "HARI K MANE", phone: "8074266799" },
  { sno: 178, name: "PRATIKSHA BALAJI SINGNALE", phone: "9611537643" },
  { sno: 179, name: "SHASHWAT SATISH SURYAWANSHI", phone: "9880545371" },
  { sno: 180, name: "AJAY SHIVAJI KAMBLE C/O PRAKASH SAVRE", phone: "7026151450" },
  { sno: 181, name: "REKHA PRAKASH SAVRE", phone: "9880791663" },
  { sno: 182, name: "SATYABHAMA BAI NARSING ROA HILLALPURE", phone: "8050082639" },
  { sno: 183, name: "GAYATRI PANDURANG HULSOOR C/O ROHIT KA", phone: null },
  { sno: 184, name: "DATTA Z WAGHMODE", phone: "9845535031" },
  { sno: 185, name: "PAWAN YESBA", phone: "9845535031" },
  { sno: 186, name: "MAHESH KHAPLE", phone: null },
  { sno: 187, name: "SUDIKSHA SACHIN BIRADAR C/O MAHESH HAD", phone: "7259735970" },
  { sno: 188, name: "GOVIND KADAM", phone: null },
  { sno: 189, name: "PAWAN RAJSHEKHAR KADWADI C/O SAVRE", phone: "8880614656" },
  { sno: 190, name: "SANJU CHAVAN C/O S V MORE", phone: "6361949054" },
  { sno: 191, name: "SUMIT PRABHAKAR BIRADAR B GAON [pama]", phone: null },
  { sno: 192, name: "SHIV AMDABADE C/O S V MORE", phone: "7625089781" },
  { sno: 193, name: "OM SAI D NITURE C/O DATTA SIR", phone: "9071267757" },
  { sno: 194, name: "DR DHANSHREE KARBHARI MEH", phone: "8971303261" },
  { sno: 195, name: "ROHIT TANAJI KAMBLE N SANGAM", phone: "9307430489" },
  { sno: 196, name: "SANGITA BIRADAR c/o bhalke", phone: "8766022135" },
  { sno: 197, name: "SAINATH DHONDIBA MEHTRE", phone: "7795361261" },
  { sno: 198, name: "KASTUR BAI MANMTHPPA AGRE", phone: "9741306181" },
  { sno: 199, name: "KAVITHA SHIVAJI WAGHMODE", phone: "7619653715" }
];

async function seedCustomersOnly() {
  console.log(`Starting bulk import of ${rawData.length} customers into Customer Directory ONLY...`);

  let createdCustomersCount = 0;
  let skippedExistingCount = 0;

  for (let item of rawData) {
    let phoneToUse = item.phone ? item.phone.trim() : null;

    // If phone number is missing or less than 10 digits, generate a unique random 10-digit phone number
    if (!phoneToUse || phoneToUse.length < 10) {
      phoneToUse = '9000' + Math.floor(100050 + Math.random() * 899949).toString();
    }

    // Check if customer already exists by phone
    let customer = await prisma.customer.findUnique({ where: { phone: phoneToUse } });

    if (!customer) {
      // Create customer profile ONLY
      await prisma.customer.create({
        data: {
          name: item.name.trim(),
          phone: phoneToUse,
        }
      });
      createdCustomersCount++;
    } else {
      skippedExistingCount++;
    }
  }

  console.log(`
======== CUSTOMER IMPORT COMPLETE ========
Total Records Processed: ${rawData.length}
New Customers Created: ${createdCustomersCount}
Existing Customers Skipped: ${skippedExistingCount}
==========================================
  `);
}

seedCustomersOnly()
  .catch(err => console.error("Import error:", err))
  .finally(async () => {
    await prisma.$disconnect();
  });
