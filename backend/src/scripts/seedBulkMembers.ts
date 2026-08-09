import prisma from '../utils/prisma';
import { addMonths, format } from 'date-fns';

const rawData = [
  { sno: 1, name: "GOVIND A MORE PATIL", status: "DUE", amount: null, date: null, phone: "9902846498" },
  { sno: 2, name: "MANISHA V V MORE PUMP", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9880059673" },
  { sno: 3, name: "BALAJI TAGLOOR", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9448716135" },
  { sno: 4, name: "SANVI BALAJI SINGNALE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9611537643" },
  { sno: 5, name: "SHIVRAJ R MULGE BOLEGAON", status: "DUE", amount: null, date: null, phone: null },
  { sno: 6, name: "URMILA BIRADAR HYD", status: "PAID", amount: 3000, date: "2025-08-04", phone: "7036017617" },
  { sno: 7, name: "VAISHNAVI GOVIND U BIRADAR HYD", status: "PAID", amount: 3000, date: "2025-08-04", phone: "7036017617" },
  { sno: 8, name: "BHARAT VITTHAL ROA D SAMJE", status: "PAID", amount: 3000, date: "2025-08-08", phone: "7337423821" },
  { sno: 9, name: "DEEPAK U MALKAPURE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 10, name: "RAGINI TANAJI JAMKHANDE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 11, name: "POONAM BALAJI MORE", status: "PAID", amount: 3000, date: "2025-11-04", phone: "9964546837" },
  { sno: 12, name: "RUPAVATI BALAJI MORE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9730969083" },
  { sno: 13, name: "SONALI TUKADE PUNE", status: "PAID", amount: 3000, date: "2025-08-02", phone: "9673211133" },
  { sno: 14, name: "NAGNATH BABURAO GAVLI", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9902812514" },
  { sno: 15, name: "VIJAYABAI BHALKE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9980537730" },
  { sno: 16, name: "DINESH BIRADAR BHALKE PUNE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "8766022135" },
  { sno: 17, name: "RAVINDRA NASKE", status: "PAID", amount: 3000, date: "2025-08-02", phone: "9902070501" },
  { sno: 18, name: "HEERABAI RAJKUMAR PATIL HANGARGA", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9108774398" },
  { sno: 19, name: "ANITA SANJAY WAGGE PUNE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9108774398" },
  { sno: 20, name: "KRISHANA BALAJI MEHTRE BOLEGAON", status: "PAID", amount: 3000, date: "2025-08-04", phone: "7447257178" },
  { sno: 21, name: "KOMAL RAJU GAROLE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 22, name: "MAMTA GUNDU S MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 23, name: "GNANESHWAR ABHANGRAO MORE HYD", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 24, name: "SUBHASH DAYANAND BULLA BOLEGAON", status: "PAID", amount: 3000, date: "2025-08-05", phone: "8217809723" },
  { sno: 25, name: "BALIRAM MALKAPURE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9901398090" },
  { sno: 26, name: "SAIDEEP BALASAHEB MORE BIDAR", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 27, name: "SRUSHTI BALASAHEB MORE BIDAR", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 28, name: "SHARNAPPA BASAVRAJ NASKE", status: "PAID", amount: 3000, date: "2025-08-02", phone: "9902070501" },
  { sno: 29, name: "ARCHANA KALYANRAO MEHTRE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "8904773514" },
  { sno: 30, name: "GUNDAJI GAJRE TUGAON", status: "DUE", amount: null, date: null, phone: "6360860055" },
  { sno: 31, name: "SHILPA RODE C/O DATTA SIR MEH", status: "PAID", amount: 3000, date: "2025-05-04", phone: "9880737619" },
  { sno: 32, name: "LATA NELWADKAR C/O DATTA SIRN MEH", status: "PAID", amount: 3000, date: "2025-05-04", phone: "9880737619" },
  { sno: 33, name: "SRIDHAR MADHAV RAO MORE", status: "PAID", amount: 3000, date: "2025-08-01", phone: null },
  { sno: 34, name: "RAJESH SRIDHAR MORE", status: "PAID", amount: 3000, date: "2025-08-01", phone: null },
  { sno: 35, name: "AVADUTH HARI WAGHMODE", status: "PAID", amount: 3000, date: "2025-05-04", phone: "9972353892" },
  { sno: 36, name: "ASHWINI RAMRATAN KANDGULE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9665839249" },
  { sno: 37, name: "SINDHANT DATTA BIRADAR BHALKI", status: "PAID", amount: 3000, date: "2025-08-02", phone: null },
  { sno: 38, name: "MEGHA DATTA BIRADAR BHALKI", status: "PAID", amount: 3000, date: "2025-08-02", phone: null },
  { sno: 39, name: "BALAJI P SHINDE SIR SAMBHAJI SCHOOL", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9743136867" },
  { sno: 40, name: "RAJSHREE SRIDHAR MORE PUNE", status: "PAID", amount: 3000, date: "2025-08-01", phone: "9403248646" },
  { sno: 41, name: "SANGITA SRIDHAR MORE", status: "PAID", amount: 3000, date: "2025-08-01", phone: "9403248646" },
  { sno: 42, name: "VEDANT BIRADAR LATUR C/O SRIDHAR MORE", status: "PAID", amount: 3000, date: "2025-08-01", phone: "9403248646" },
  { sno: 43, name: "DATTA DAPKE MANKESHWAR", status: "PAID", amount: 3000, date: "2025-08-02", phone: "6363986841" },
  { sno: 44, name: "TANMAY ARVIND MORE MORE JEWELLERS", status: "DUE", amount: null, date: null, phone: "8019574096" },
  { sno: 45, name: "UDDHAVRAO MALKAPURE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 46, name: "BAJRANG BORATE", status: "PAID", amount: 3000, date: "2025-08-03", phone: "9686965787" },
  { sno: 47, name: "BRAMHA BORATE MANKESHAE", status: "PAID", amount: 3000, date: "2025-08-03", phone: "9686965787" },
  { sno: 48, name: "SOMNATH SONPE SRIMALI PUMP", status: "PAID", amount: 3000, date: "2025-07-28", phone: "9611267231" },
  { sno: 49, name: "PARMESHWAR BARDALE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "7204901432" },
  { sno: 50, name: "LAITHA MADHUKAR KARBHARI KHATPATE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 51, name: "POOJA BRAHMAJI KHATPATE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 52, name: "PRAMOD S HILALPURE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 53, name: "PRAMOD S HILALPURE 2", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 54, name: "PRAMOD S HILALPURE 3", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 55, name: "PRAMOD S HILALPURE 4", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 56, name: "BALAJI TAGLOOR 2", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 57, name: "RADHIKA D SAMJE HYD", status: "PAID", amount: 3000, date: "2025-08-05", phone: "6300281760" },
  { sno: 58, name: "SACHIN KUMAR NELWADKAR", status: "PAID", amount: 3000, date: "2025-05-04", phone: null },
  { sno: 59, name: "SANDEEP KUMAR NELWADKAR", status: "PAID", amount: 3000, date: "2025-05-04", phone: null },
  { sno: 60, name: "AKASH PRAKASHROA YAKURKE", status: "PAID", amount: 3000, date: "2025-08-08", phone: "7620705919" },
  { sno: 61, name: "ASHISH PRAKASHROA YAKURKE", status: "PAID", amount: 3000, date: "2025-08-08", phone: "7620705916" },
  { sno: 62, name: "SHILPA MANE MUMBAI C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "7625089781" },
  { sno: 63, name: "SIDDU VAIJU MORE SAI PRINTER", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9611789214" },
  { sno: 64, name: "KIRAN MALCHIMANE SRIMALI", status: "PAID", amount: 3000, date: "2025-08-04", phone: "8007617414" },
  { sno: 65, name: "RAGINI SANTOSH CHAFEKAR", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 66, name: "SHESHANATH VENKAT HASURE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "6281218824" },
  { sno: 67, name: "PRAVEEN BALAJI MORE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 68, name: "REKHA BAI DATTA BIRADAR SIR MEH", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9164051566" },
  { sno: 69, name: "SANDEEP ANKUSH CHAFEKAR", status: "PAID", amount: 3000, date: "2025-08-05", phone: "8123257731" },
  { sno: 70, name: "SRINIVAS PAWAR LATUR C/O RAJU MANE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9420826117" },
  { sno: 71, name: "JAYA SINDUJA C/O RAJU MANE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "799565905" },
  { sno: 72, name: "SUDHEER KUDPANE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "8374190318" },
  { sno: 73, name: "KANAYA SUDHEER KUDPANE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "8374190318" },
  { sno: 74, name: "MANAS MAHESH HADOLE", status: "PAID", amount: 3000, date: "2025-08-02", phone: null },
  { sno: 75, name: "GUNDAPPA AINAPURE MEH", status: "PAID", amount: 3000, date: "2025-08-10", phone: "7794032965" },
  { sno: 76, name: "SUNITA RAJU BHALKE C/O ANK CHAFEKAR", status: "PAID", amount: 3000, date: "2025-08-05", phone: "8310510322" },
  { sno: 77, name: "BALAJI TAGLOOR 3", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9448716135" },
  { sno: 78, name: "GOPAL RAJARAM MANKESHWAR", status: "PAID", amount: 3000, date: "2025-05-04", phone: "9632414390" },
  { sno: 79, name: "MIRA JYOTI RAM PAWAR MEH", status: "PAID", amount: 3000, date: "2025-08-03", phone: "9148187817" },
  { sno: 80, name: "SANTOSH DEEPALI MEHTRE C/O D MEHTRE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9890380240" },
  { sno: 81, name: "SRIHARI BIRADAR LATUR", status: "PAID", amount: 3000, date: "2025-08-03", phone: "88885752239" },
  { sno: 82, name: "PAVAN K SHIVARE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "8904357516" },
  { sno: 83, name: "SNEHA PREMAJI MORE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "7676825552" },
  { sno: 84, name: "SUNITA ANKUSH CHAFEKAR", status: "PAID", amount: 3000, date: "2025-08-05", phone: "7411437731" },
  { sno: 85, name: "BALIKA PAWAR LATUR", status: "PAID", amount: 3000, date: "2025-05-04", phone: "8459894808" },
  { sno: 86, name: "BHARATHA BAI PANDURANG KADAM", status: "PAID", amount: 3000, date: "2025-05-04", phone: "9113087060" },
  { sno: 87, name: "MAYURI SATYAWAN BHALKE C/O MANKESHARE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "7026709755" },
  { sno: 88, name: "RANJEET MAHADEV KUMBHAR", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 89, name: "KISHOR SHESHERAO INDRALE B WADI", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 90, name: "JYOTI KISHORE INDRALE", status: "DUE", amount: null, date: null, phone: null },
  { sno: 91, name: "SHIVAJI WAGHMODE MEH", status: "PAID", amount: 3000, date: "2025-08-03", phone: "9900894089" },
  { sno: 92, name: "SUPRIYA S NELWADKAR", status: "PAID", amount: 3000, date: "2025-05-04", phone: "9845008746" },
  { sno: 93, name: "VEDANSHI V CHINCHOLE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9164051566" },
  { sno: 94, name: "BALAJI TAGLOOR 4", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 95, name: "DAKSH SHIVAJI WARNALE", status: "PAID", amount: 3000, date: "2025-08-01", phone: null },
  { sno: 96, name: "MAHESH SHANKAR RAO PANCHAL", status: "PAID", amount: 3000, date: "2025-08-05", phone: "7618727516" },
  { sno: 97, name: "NARSING D POCHE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "7975658718" },
  { sno: 98, name: "NARAYAN KAMBLE", status: "PAID", amount: 3000, date: "2025-08-03", phone: "9881612385" },
  { sno: 99, name: "RADHIKA SURYAWANSI GANESH KARAGIR", status: "PAID", amount: 3000, date: "2025-09-03", phone: "6363654531" },
  { sno: 100, name: "GANESH SHARWALE HYD", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 101, name: "V V MORE PUMP", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 102, name: "SHRISTI VITHAL MORE PUMP", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 103, name: "SAMRATH VITHAL MORE PUMP", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 104, name: "RUDRA SANTOSH MORE PATIL MEH", status: "PAID", amount: 3000, date: "2025-08-02", phone: "7259634642" },
  { sno: 105, name: "CHINTU AMBADAS KAMBLE PAN SHOP", status: "PAID", amount: 3000, date: "2025-08-05", phone: "7219072703" },
  { sno: 106, name: "ANVIT DATTA SABNE MEH", status: "PAID", amount: 3000, date: "2025-08-05", phone: "8951361343" },
  { sno: 107, name: "ADVIK BALAJI SABNE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 108, name: "RUPALI DATTA SABNE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 109, name: "AARTI BALAJI SABNE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 110, name: "RAHIM FARID SAIKH", status: "DUE", amount: null, date: null, phone: "9008146748" },
  { sno: 111, name: "SANGMESH RACHANA MEHTRE PUMP", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9342145229" },
  { sno: 112, name: "SHIVAJI KAKA BOLEGOAN", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 113, name: "MAHESH HADOLE", status: "PAID", amount: 3000, date: "2025-08-02", phone: null },
  { sno: 114, name: "MUKESH HADOLE", status: "PAID", amount: 3000, date: "2025-08-02", phone: null },
  { sno: 115, name: "YOGESH HADOLE", status: "PAID", amount: 3000, date: "2025-08-02", phone: null },
  { sno: 116, name: "KRISHANA YASHWANTH JADHAV KHATPATE", status: "PAID", amount: 3000, date: "2025-08-01", phone: null },
  { sno: 117, name: "YASHAWANTH JADHAV MEH KHATPATE", status: "PAID", amount: 3000, date: "2025-08-01", phone: null },
  { sno: 118, name: "NIVAS YEKURKE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 119, name: "SUDHARANI YEKURKE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 120, name: "SHIVKANYA KIRAN MALCHIMANE SRIMALI", status: "PAID", amount: 3000, date: "2025-08-01", phone: "8007617414" },
  { sno: 121, name: "POOJA BALIRAM MALKAPURE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9901398090" },
  { sno: 122, name: "PRASHANT VENKAT MEHTRE B KALYAN", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 123, name: "AMBIKA SANJEEV JADGE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "7353801061" },
  { sno: 124, name: "KARTIK BALAJI SINGNALE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9611537643" },
  { sno: 125, name: "SUMIT SANTOSH CHAFEKAR MEH", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9980282716" },
  { sno: 126, name: "CHANDRASHEKHAR S MOLKIRE", status: "PAID", amount: 3000, date: "2025-05-04", phone: "9513863099" },
  { sno: 127, name: "VINOD MADHAVRAO MORE DUBAI", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9561496799" },
  { sno: 128, name: "SHANKAR VITHAL RAO JADHAV", status: "PAID", amount: 3000, date: "2025-08-06", phone: "8494856469" },
  { sno: 129, name: "SATYABHAMA DNY HALSE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 130, name: "RADHIKA DNY HALSE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 131, name: "AMBIKA DNY HALSE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 132, name: "DNY HALSE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 133, name: "KAMLA BAI UPPAL HYD SAKHU", status: "PAID", amount: 3000, date: "2025-08-06", phone: null },
  { sno: 134, name: "OMKAR WINE SHOP", status: "PAID", amount: 3000, date: "2025-08-26", phone: null },
  { sno: 135, name: "RAVINDAR BASVANT APPA PATIL WINE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9902222696" },
  { sno: 136, name: "BANSHI DATTA LONE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 137, name: "TRUPTHI RAJU MANE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 138, name: "RAJU MANE HYD", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 139, name: "RAJASHREE KAILASH ROLE", status: "PAID", amount: 3000, date: "2025-08-03", phone: null },
  { sno: 140, name: "KAILASH ROLE", status: "PAID", amount: 3000, date: "2025-08-03", phone: null },
  { sno: 141, name: "DEVASHREE KAILASH ROLE", status: "PAID", amount: 3000, date: "2025-08-03", phone: null },
  { sno: 142, name: "ADITI KAILASH ROLE MEH", status: "PAID", amount: 3000, date: "2025-08-03", phone: null },
  { sno: 143, name: "BHAGYASHREE ARVIND MORE JEWELLERS", status: "PAID", amount: 3000, date: "2025-08-05", phone: "6281218824" },
  { sno: 144, name: "SANVI NAVNATH PATIL", status: "PAID", amount: 2000, date: "2025-08-05", phone: null },
  { sno: 145, name: "MAYURI SURYAWANSI GANESH KARAGIR", status: "PAID", amount: 3000, date: "2025-09-03", phone: "6363654531" },
  { sno: 146, name: "OM HOTEL TEA", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 147, name: "MALLIKARAJUN KASHAPA NASKE C/O R.MORE", status: "PAID", amount: 3000, date: "2025-08-03", phone: "8747998280" },
  { sno: 148, name: "RUPESH RAJENDER MORE", status: "PAID", amount: 3000, date: "2025-08-03", phone: "6360241527" },
  { sno: 149, name: "NAMDEV MADHU KUMBHAR SRIMALI", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9545421007" },
  { sno: 150, name: "DATTATRI TAMBOLE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9353780366" },
  { sno: 151, name: "SRIDHAR PANDURANG KADAM", status: "PAID", amount: 3000, date: "2025-05-04", phone: "9113087060" },
  { sno: 152, name: "ANJALI JADHAV C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9920835438" },
  { sno: 153, name: "DARSHU JADHAV C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9920835438" },
  { sno: 154, name: "GANESH MANKARE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9945084171" },
  { sno: 155, name: "MUNAWAR SHAIKH C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9004835754" },
  { sno: 156, name: "MD ZAID C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9004835754" },
  { sno: 157, name: "PAYAL JADHAV C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9987366615" },
  { sno: 158, name: "ULLAS KAMBLE MEH", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9901583548" },
  { sno: 159, name: "VIJAY SALUNKE MUNNA", status: "PAID", amount: 3000, date: "2025-08-05", phone: "8149149629" },
  { sno: 160, name: "VISHAKHA BAIS NANDED C/O VIJAY SALUNKE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "7722093920" },
  { sno: 161, name: "USHA PATIL JAWALGA", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 162, name: "POOJA PRABHAKAR BIRADAR PUNE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 163, name: "PRABHAKAR VITHAL RAO MORE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 164, name: "BALAJI VITHAL MORE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 165, name: "BHARATH BAI VITHAL RAO MORE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 166, name: "AJIT PRABHAKAR MORE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 167, name: "DEEPA SATISH MORE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 168, name: "PAWAN BALAJI MORE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 169, name: "LAXMI SATISH MORE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 170, name: "MEGHA RANI CHAVAN C/O S V MORE", status: "PAID", amount: 3000, date: "2025-05-04", phone: null },
  { sno: 171, name: "NITEEN PRABHAKAR BIRADAR BOLEGAON", status: "PAID", amount: 3000, date: "2025-05-04", phone: null },
  { sno: 172, name: "BRAMHAJI KHATPATE [R]", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 173, name: "MADHUMATI SATISH SURYANSHI", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9743352287" },
  { sno: 174, name: "DHANSHREE V CHAUDHARIC/0 SAVRE SIR", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9880791663" },
  { sno: 175, name: "VAISHNAVI INGLE ATHARGA C/O GUNDUMORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9850868189" },
  { sno: 176, name: "KHANDU SHESHERAO SHIVARE", status: "PAID", amount: 3000, date: "2025-08-02", phone: "9900249597" },
  { sno: 177, name: "HARI K MANE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "8074266799" },
  { sno: 178, name: "PRATIKSHA BALAJI SINGNALE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9611537643" },
  { sno: 179, name: "SHASHWAT SATISH SURYAWANSHI", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9880545371" },
  { sno: 180, name: "AJAY SHIVAJI KAMBLE C/O PRAKASH SAVRE", status: "PAID", amount: 3000, date: "2025-08-01", phone: "7026151450" },
  { sno: 181, name: "REKHA PRAKASH SAVRE", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9880791663" },
  { sno: 182, name: "SATYABHAMA BAI NARSING ROA HILLALPURE", status: "PAID", amount: 3000, date: "2025-08-03", phone: "8050082639" },
  { sno: 183, name: "GAYATRI PANDURANG HULSOOR C/O ROHIT KA", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 184, name: "DATTA Z WAGHMODE", status: "PAID", amount: 3000, date: "2025-08-01", phone: "9845535031" },
  { sno: 185, name: "PAWAN YESBA", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9845535031" },
  { sno: 186, name: "MAHESH KHAPLE", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 187, name: "SUDIKSHA SACHIN BIRADAR C/O MAHESH HAD", status: "PAID", amount: 3000, date: "2025-08-02", phone: "7259735970" },
  { sno: 188, name: "GOVIND KADAM", status: "PAID", amount: 3000, date: "2025-08-05", phone: null },
  { sno: 189, name: "PAWAN RAJSHEKHAR KADWADI C/O SAVRE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "8880614656" },
  { sno: 190, name: "SANJU CHAVAN C/O S V MORE", status: "PAID", amount: 3000, date: "2025-05-04", phone: "6361949054" },
  { sno: 191, name: "SUMIT PRABHAKAR BIRADAR B GAON [pama]", status: "PAID", amount: 3000, date: "2025-08-04", phone: null },
  { sno: 192, name: "SHIV AMDABADE C/O S V MORE", status: "PAID", amount: 3000, date: "2025-08-05", phone: "7625089781" },
  { sno: 193, name: "OM SAI D NITURE C/O DATTA SIR", status: "PAID", amount: 3000, date: "2025-08-05", phone: "9071267757" },
  { sno: 194, name: "DR DHANSHREE KARBHARI MEH", status: "PAID", amount: 3000, date: "2025-08-04", phone: "8971303261" },
  { sno: 195, name: "ROHIT TANAJI KAMBLE N SANGAM", status: "PAID", amount: 3000, date: "2025-08-04", phone: "9307430489" },
  { sno: 196, name: "SANGITA BIRADAR c/o bhalke", status: "PAID", amount: 3000, date: "2025-08-04", phone: "8766022135" },
  { sno: 197, name: "SAINATH DHONDIBA MEHTRE", status: "PAID", amount: 3000, date: "2025-07-27", phone: "7795361261" },
  { sno: 198, name: "KASTUR BAI MANMTHPPA AGRE", status: "PAID", amount: 3000, date: "2025-07-27", phone: "9741306181" },
  { sno: 199, name: "KAVITHA SHIVAJI WAGHMODE", status: "PAID", amount: 3000, date: "2025-08-03", phone: "7619653715" }
];

async function seed() {
  console.log(`Starting bulk import of ${rawData.length} members...`);

  // 1. Create Bishi Scheme "3000 MONTHLY BISHI SCHEME"
  const bishiName = "3000 MONTHLY BISHI SCHEME";
  let bishi = await prisma.bishi.findFirst({ where: { name: bishiName } });
  
  if (!bishi) {
    bishi = await prisma.bishi.create({
      data: {
        name: bishiName,
        startDate: new Date("2025-08-01T00:00:00.000Z"),
        durationMonths: 20, // 20 month scheme
        monthlyAmount: 3000,
        winnersPerMonth: 1,
        status: "ACTIVE"
      }
    });
    console.log(`Created new Bishi scheme #${bishi.id}: ${bishi.name}`);
  } else {
    console.log(`Using existing Bishi scheme #${bishi.id}: ${bishi.name}`);
  }

  let createdCustomersCount = 0;
  let addedMembersCount = 0;
  let recordedPaymentsCount = 0;

  for (let item of rawData) {
    let phoneToUse = item.phone ? item.phone.trim() : null;

    // Check if phone number is missing or invalid
    if (!phoneToUse || phoneToUse.length < 10) {
      // Generate unique random 10-digit phone starting with 9000
      phoneToUse = '9000' + Math.floor(100050 + Math.random() * 899949).toString();
    }

    // Check if customer exists by phone
    let customer = await prisma.customer.findUnique({ where: { phone: phoneToUse } });

    if (!customer) {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          name: item.name.trim(),
          phone: phoneToUse,
        }
      });
      createdCustomersCount++;
    }

    // Check if member already exists in this Bishi
    let member = await prisma.bishiMember.findFirst({
      where: {
        bishiId: bishi.id,
        customerId: customer.id
      }
    });

    if (!member) {
      member = await prisma.bishiMember.create({
        data: {
          bishiId: bishi.id,
          customerId: customer.id,
          memberNumber: item.sno,
        }
      });
      addedMembersCount++;

      // Create installment records for Month 1 through durationMonths (20 months)
      for (let m = 1; m <= bishi.durationMonths; m++) {
        const monthLabel = format(addMonths(new Date(bishi.startDate), m - 1), 'MMMM yyyy');
        const dueCarriedForward = (m - 1) * 3000;
        const totalPayable = m * 3000;

        await prisma.bishiPayment.create({
          data: {
            bishiId: bishi.id,
            bishiMemberId: member.id,
            monthNumber: m,
            monthLabel,
            amountDue: 3000,
            dueCarriedForward,
            totalPayable,
            amountPaid: 0,
            totalOutstanding: totalPayable,
            status: "PENDING"
          }
        });
      }
    }

    // Record Month 1 payment if item is PAID
    if (item.status === 'PAID' && item.amount) {
      const pDate = item.date ? new Date(item.date) : new Date();
      await prisma.bishiPayment.updateMany({
        where: {
          bishiMemberId: member.id,
          monthNumber: 1
        },
        data: {
          amountPaid: item.amount,
          totalOutstanding: Math.max(0, 3000 - item.amount),
          paymentDate: pDate,
          paymentMode: "CASH",
          status: item.amount >= 3000 ? "PAID" : "PARTIAL"
        }
      });
      recordedPaymentsCount++;
    }
  }

  console.log(`
======== IMPORT COMPLETE ========
Total Processed: ${rawData.length}
New Customers Created: ${createdCustomersCount}
Bishi Members Added: ${addedMembersCount}
Payments Recorded: ${recordedPaymentsCount}
=================================
  `);
}

seed()
  .catch(err => console.error("Import error:", err))
  .finally(async () => {
    await prisma.$disconnect();
  });
