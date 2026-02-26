export interface DocumentSection {
  id: string
  title: string
  text: string
  plainEnglish?: string // brief built-in summary
}

export interface FoundingDocument {
  id: string
  title: string
  subtitle: string
  year: number
  description: string
  sections: DocumentSection[]
}

export const FOUNDING_DOCUMENTS: FoundingDocument[] = [
  {
    id: 'declaration',
    title: 'Declaration of Independence',
    subtitle: 'Adopted July 4, 1776',
    year: 1776,
    description: 'The formal statement declaring the thirteen American colonies free and independent from Great Britain, articulating the fundamental rights of citizens and the principles of self-governance.',
    sections: [
      {
        id: 'dec-preamble',
        title: 'Preamble',
        text: 'When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature\'s God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.',
        plainEnglish: 'When a group of people needs to break away from another country, they owe the world an explanation for why.',
      },
      {
        id: 'dec-rights',
        title: 'Statement of Rights',
        text: 'We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.—That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed,—That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government, laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness.',
        plainEnglish: 'Everyone is born with rights that no government can take away — including life, freedom, and the ability to pursue happiness. Governments exist only because the people allow them to. If a government fails the people, they have the right to change it or replace it.',
      },
      {
        id: 'dec-prudence',
        title: 'Prudence & Patience',
        text: 'Prudence, indeed, will dictate that Governments long established should not be changed for light and transient causes; and accordingly all experience hath shewn, that mankind are more disposed to suffer, while evils are sufferable, than to right themselves by abolishing the forms to which they are accustomed. But when a long train of abuses and usurpations, pursuing invariably the same Object evinces a design to reduce them under absolute Despotism, it is their right, it is their duty, to throw off such Government, and to provide new Guards for their future security.',
        plainEnglish: 'You shouldn\'t overthrow a government over small problems — people tend to put up with a lot before acting. But when there\'s a clear pattern of abuse aimed at total control, it\'s not just their right but their duty to replace that government.',
      },
      {
        id: 'dec-grievances',
        title: 'Grievances Against the King',
        text: 'Such has been the patient sufferance of these Colonies; and such is now the necessity which constrains them to alter their former Systems of Government. The history of the present King of Great Britain is a history of repeated injuries and usurpations, all having in direct object the establishment of an absolute Tyranny over these States. To prove this, let Facts be submitted to a candid world.\n\nHe has refused his Assent to Laws, the most wholesome and necessary for the public good.\n\nHe has forbidden his Governors to pass Laws of immediate and pressing importance, unless suspended in their operation till his Assent should be obtained; and when so suspended, he has utterly neglected to attend to them.\n\nHe has refused to pass other Laws for the accommodation of large districts of people, unless those people would relinquish the right of Representation in the Legislature, a right inestimable to them and formidable to tyrants only.\n\nHe has called together legislative bodies at places unusual, uncomfortable, and distant from the depository of their public Records, for the sole purpose of fatiguing them into compliance with his measures.\n\nHe has dissolved Representative Houses repeatedly, for opposing with manly firmness his invasions on the rights of the people.\n\nHe has refused for a long time, after such dissolutions, to cause others to be elected; whereby the Legislative powers, incapable of Annihilation, have returned to the People at large for their exercise; the State remaining in the mean time exposed to all the dangers of invasion from without, and convulsions within.\n\nHe has endeavoured to prevent the population of these States; for that purpose obstructing the Laws for Naturalization of Foreigners; refusing to pass others to encourage their migrations hither, and raising the conditions of new Appropriations of Lands.\n\nHe has obstructed the Administration of Justice, by refusing his Assent to Laws for establishing Judiciary powers.\n\nHe has made Judges dependent on his Will alone, for the tenure of their offices, and the amount and payment of their salaries.\n\nHe has erected a multitude of New Offices, and sent hither swarms of Officers to harrass our people, and eat out their substance.\n\nHe has kept among us, in times of peace, Standing Armies without the Consent of our legislatures.\n\nHe has affected to render the Military independent of and superior to the Civil power.\n\nHe has combined with others to subject us to a jurisdiction foreign to our constitution, and unacknowledged by our laws; giving his Assent to their Acts of pretended Legislation.\n\nFor Quartering large bodies of armed troops among us.\n\nFor protecting them, by a mock Trial, from punishment for any Murders which they should commit on the Inhabitants of these States.\n\nFor cutting off our Trade with all parts of the world.\n\nFor imposing Taxes on us without our Consent.\n\nFor depriving us in many cases, of the benefits of Trial by Jury.\n\nFor transporting us beyond Seas to be tried for pretended offences.\n\nFor abolishing the free System of English Laws in a neighbouring Province, establishing therein an Arbitrary government, and enlarging its Boundaries so as to render it at once an example and fit instrument for introducing the same absolute rule into these Colonies.\n\nFor taking away our Charters, abolishing our most valuable Laws, and altering fundamentally the Forms of our Governments.\n\nFor suspending our own Legislatures, and declaring themselves invested with power to legislate for us in all cases whatsoever.\n\nHe has abdicated Government here, by declaring us out of his Protection and waging War against us.\n\nHe has plundered our seas, ravaged our Coasts, burnt our towns, and destroyed the lives of our people.\n\nHe is at this time transporting large Armies of foreign Mercenaries to compleat the works of death, desolation and tyranny, already begun with circumstances of Cruelty & perfidy scarcely paralleled in the most barbarous ages, and totally unworthy the Head of a civilized nation.\n\nHe has constrained our fellow Citizens taken Captive on the high Seas to bear Arms against their Country, to become the executioners of their friends and Brethren, or to fall themselves by their Hands.\n\nHe has excited domestic insurrections amongst us, and has endeavoured to bring on the inhabitants of our frontiers, the merciless Indian Savages, whose known rule of warfare, is an undistinguished destruction of all ages, sexes and conditions.',
        plainEnglish: 'A long list of 27 specific complaints against King George III, including: blocking necessary laws, dissolving legislatures, cutting off trade, taxing without consent, denying jury trials, and waging war against the colonists.',
      },
      {
        id: 'dec-appeals',
        title: 'Appeals to Britain',
        text: 'In every stage of these Oppressions We have Petitioned for Redress in the most humble terms: Our repeated Petitions have been answered only by repeated injury. A Prince whose character is thus marked by every act which may define a Tyrant, is unfit to be the ruler of a free people.\n\nNor have We been wanting in attentions to our Brittish brethren. We have warned them from time to time of attempts by their legislature to extend an unwarrantable jurisdiction over us. We have reminded them of the circumstances of our emigration and settlement here. We have appealed to their native justice and magnanimity, and we have conjured them by the ties of our common kindred to disavow these usurpations, which, would inevitably interrupt our connections and correspondence. They too have been deaf to the voice of justice and of consanguinity. We must, therefore, acquiesce in the necessity, which denounces our Separation, and hold them, as we hold the rest of mankind, Enemies in War, in Peace Friends.',
        plainEnglish: 'We tried everything — we asked nicely, we petitioned, we appealed to our fellow British citizens. None of it worked. A ruler who acts this way is a tyrant, and we have no choice but to separate.',
      },
      {
        id: 'dec-resolution',
        title: 'Declaration of Independence',
        text: 'We, therefore, the Representatives of the united States of America, in General Congress, Assembled, appealing to the Supreme Judge of the world for the rectitude of our intentions, do, in the Name, and by Authority of the good People of these Colonies, solemnly publish and declare, That these United Colonies are, and of Right ought to be Free and Independent States; that they are Absolved from all Allegiance to the British Crown, and that all political connection between them and the State of Great Britain, is and ought to be totally dissolved; and that as Free and Independent States, they have full Power to levy War, conclude Peace, contract Alliances, establish Commerce, and to do all other Acts and Things which Independent States may of right do. And for the support of this Declaration, with a firm reliance on the protection of divine Providence, we mutually pledge to each other our Lives, our Fortunes and our sacred Honor.',
        plainEnglish: 'Therefore, we officially declare that these colonies are free and independent states with no ties to Britain. As independent states, they can make war, peace, alliances, and trade. We pledge our lives, our wealth, and our honor to this cause.',
      },
    ],
  },
  {
    id: 'constitution',
    title: 'U.S. Constitution',
    subtitle: 'Ratified June 21, 1788',
    year: 1788,
    description: 'The supreme law of the United States, establishing the framework of the federal government, defining the separation of powers, and protecting fundamental liberties.',
    sections: [
      {
        id: 'con-preamble',
        title: 'Preamble',
        text: 'We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.',
        plainEnglish: 'We, the American people, are creating this Constitution to build a better country — one with justice, peace, safety, prosperity, and freedom for us and future generations.',
      },
      {
        id: 'con-article-1',
        title: 'Article I — The Legislative Branch',
        text: 'Section 1. All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives.\n\nSection 2. The House of Representatives shall be composed of Members chosen every second Year by the People of the several States, and the Electors in each State shall have the Qualifications requisite for Electors of the most numerous Branch of the State Legislature. No Person shall be a Representative who shall not have attained to the Age of twenty five Years, and been seven Years a Citizen of the United States, and who shall not, when elected, be an Inhabitant of that State in which he shall be chosen. Representatives and direct Taxes shall be apportioned among the several States which may be included within this Union, according to their respective Numbers. The actual Enumeration shall be made within three Years after the first Meeting of the Congress of the United States, and within every subsequent Term of ten Years, in such Manner as they shall by Law direct. The Number of Representatives shall not exceed one for every thirty Thousand, but each State shall have at Least one Representative. The House of Representatives shall chuse their Speaker and other Officers; and shall have the sole Power of Impeachment.\n\nSection 3. The Senate of the United States shall be composed of two Senators from each State, chosen by the Legislature thereof, for six Years; and each Senator shall have one Vote. Immediately after they shall be assembled in Consequence of the first Election, they shall be divided as equally as may be into three Classes. The Vice President of the United States shall be President of the Senate, but shall have no Vote, unless they be equally divided. The Senate shall chuse their other Officers, and also a President pro tempore, in the Absence of the Vice President. The Senate shall have the sole Power to try all Impeachments. When sitting for that Purpose, they shall be on Oath or Affirmation. When the President of the United States is tried, the Chief Justice shall preside: And no Person shall be convicted without the Concurrence of two thirds of the Members present. Judgment in Cases of Impeachment shall not extend further than to removal from Office, and disqualification to hold and enjoy any Office of honor, Trust or Profit under the United States.\n\nSection 7. Every Bill which shall have passed the House of Representatives and the Senate, shall, before it become a Law, be presented to the President of the United States; If he approve he shall sign it, but if not he shall return it, with his Objections to that House in which it shall have originated. If after such Reconsideration two thirds of that House shall agree to pass the Bill, it shall be sent, together with the Objections, to the other House, by which it shall likewise be reconsidered, and if approved by two thirds of that House, it shall become a Law.\n\nSection 8. The Congress shall have Power To lay and collect Taxes, Duties, Imposts and Excises, to pay the Debts and provide for the common Defence and general Welfare of the United States; To borrow Money on the credit of the United States; To regulate Commerce with foreign Nations, and among the several States; To establish an uniform Rule of Naturalization; To coin Money; To establish Post Offices and post Roads; To promote the Progress of Science and useful Arts, by securing for limited Times to Authors and Inventors the exclusive Right to their respective Writings and Discoveries; To constitute Tribunals inferior to the supreme Court; To declare War; To raise and support Armies; To provide and maintain a Navy; To make all Laws which shall be necessary and proper for carrying into Execution the foregoing Powers.\n\nSection 9. The Privilege of the Writ of Habeas Corpus shall not be suspended, unless when in Cases of Rebellion or Invasion the public Safety may require it. No Bill of Attainder or ex post facto Law shall be passed. No Tax or Duty shall be laid on Articles exported from any State. No Money shall be drawn from the Treasury, but in Consequence of Appropriations made by Law.\n\nSection 10. No State shall enter into any Treaty, Alliance, or Confederation; grant Letters of Marque and Reprisal; coin Money; pass any Bill of Attainder, ex post facto Law, or Law impairing the Obligation of Contracts.',
        plainEnglish: 'Congress (the Senate and House of Representatives) makes the laws. The House has members elected every 2 years based on state population. The Senate has 2 senators per state serving 6-year terms. Congress can tax, borrow money, regulate trade, declare war, and make all necessary laws. Certain powers are denied to both Congress and the states.',
      },
      {
        id: 'con-article-2',
        title: 'Article II — The Executive Branch',
        text: 'Section 1. The executive Power shall be vested in a President of the United States of America. He shall hold his Office during the Term of four Years, and, together with the Vice President, chosen for the same Term, be elected. No Person except a natural born Citizen, or a Citizen of the United States, at the time of the Adoption of this Constitution, shall be eligible to the Office of President; neither shall any Person be eligible to that Office who shall not have attained to the Age of thirty five Years, and been fourteen Years a Resident within the United States. Before he enter on the Execution of his Office, he shall take the following Oath or Affirmation:—"I do solemnly swear (or affirm) that I will faithfully execute the Office of President of the United States, and will to the best of my Ability, preserve, protect and defend the Constitution of the United States."\n\nSection 2. The President shall be Commander in Chief of the Army and Navy of the United States. He shall have Power, by and with the Advice and Consent of the Senate, to make Treaties, provided two thirds of the Senators present concur; and he shall nominate, and by and with the Advice and Consent of the Senate, shall appoint Ambassadors, other public Ministers and Consuls, Judges of the supreme Court, and all other Officers of the United States.\n\nSection 3. He shall from time to time give to the Congress Information of the State of the Union, and recommend to their Consideration such Measures as he shall judge necessary and expedient.\n\nSection 4. The President, Vice President and all civil Officers of the United States, shall be removed from Office on Impeachment for, and Conviction of, Treason, Bribery, or other high Crimes and Misdemeanors.',
        plainEnglish: 'The President runs the government, serves a 4-year term, must be a natural-born citizen and at least 35. The President commands the military, makes treaties (with Senate approval), appoints judges and officials, gives the State of the Union, and can be removed through impeachment for serious crimes.',
      },
      {
        id: 'con-article-3',
        title: 'Article III — The Judicial Branch',
        text: 'Section 1. The judicial Power of the United States, shall be vested in one supreme Court, and in such inferior Courts as the Congress may from time to time ordain and establish. The Judges, both of the supreme and inferior Courts, shall hold their Offices during good Behaviour, and shall, at stated Times, receive for their Services, a Compensation, which shall not be diminished during their Continuance in Office.\n\nSection 2. The judicial Power shall extend to all Cases, in Law and Equity, arising under this Constitution, the Laws of the United States, and Treaties made; to all Cases affecting Ambassadors; to Controversies between two or more States; between a State and Citizens of another State; between Citizens of different States. The Trial of all Crimes, except in Cases of Impeachment, shall be by Jury; and such Trial shall be held in the State where the said Crimes shall have been committed.\n\nSection 3. Treason against the United States, shall consist only in levying War against them, or in adhering to their Enemies, giving them Aid and Comfort. No Person shall be convicted of Treason unless on the Testimony of two Witnesses to the same overt Act, or on Confession in open Court.',
        plainEnglish: 'The Supreme Court and lower federal courts interpret the law. Judges serve for life (as long as they behave). Federal courts handle cases involving the Constitution, federal laws, disputes between states, and more. All criminal trials require a jury. Treason is narrowly defined and hard to convict.',
      },
      {
        id: 'con-article-4',
        title: 'Article IV — The States',
        text: 'Section 1. Full Faith and Credit shall be given in each State to the public Acts, Records, and judicial Proceedings of every other State.\n\nSection 2. The Citizens of each State shall be entitled to all Privileges and Immunities of Citizens in the several States.\n\nSection 3. New States may be admitted by the Congress into this Union.\n\nSection 4. The United States shall guarantee to every State in this Union a Republican Form of Government, and shall protect each of them against Invasion; and on Application of the Legislature, or of the Executive (when the Legislature cannot be convened) against domestic Violence.',
        plainEnglish: 'States must respect each other\'s laws and court decisions. Citizens of one state have rights in all states. Congress can admit new states. The federal government guarantees every state a representative government and protection from invasion.',
      },
      {
        id: 'con-article-5',
        title: 'Article V — Amendments',
        text: 'The Congress, whenever two thirds of both Houses shall deem it necessary, shall propose Amendments to this Constitution, or, on the Application of the Legislatures of two thirds of the several States, shall call a Convention for proposing Amendments, which, in either Case, shall be valid to all Intents and Purposes, as Part of this Constitution, when ratified by the Legislatures of three fourths of the several States, or by Conventions in three fourths thereof.',
        plainEnglish: 'The Constitution can be changed (amended). This requires a two-thirds vote in Congress to propose, then three-fourths of states must ratify. This is intentionally difficult — the Constitution should only change with broad consensus.',
      },
      {
        id: 'con-article-6',
        title: 'Article VI — Supremacy',
        text: 'This Constitution, and the Laws of the United States which shall be made in Pursuance thereof; and all Treaties made, or which shall be made, under the Authority of the United States, shall be the supreme Law of the Land; and the Judges in every State shall be bound thereby, any Thing in the Constitution or Laws of any State to the Contrary notwithstanding.\n\nThe Senators and Representatives before mentioned, and the Members of the several State Legislatures, and all executive and judicial Officers, both of the United States and of the several States, shall be bound by Oath or Affirmation, to support this Constitution; but no religious Test shall ever be required as a Qualification to any Office or public Trust under the United States.',
        plainEnglish: 'The Constitution is the highest law in the country — it overrides any state law that conflicts with it. All government officials must swear to support the Constitution, and no religious test can be required for any government office.',
      },
      {
        id: 'con-article-7',
        title: 'Article VII — Ratification',
        text: 'The Ratification of the Conventions of nine States, shall be sufficient for the Establishment of this Constitution between the States so ratifying the Same.\n\nDone in Convention by the Unanimous Consent of the States present the Seventeenth Day of September in the Year of our Lord one thousand seven hundred and Eighty seven and of the Independence of the United States of America the Twelfth.',
        plainEnglish: 'The Constitution took effect once 9 of the 13 states ratified it. It was signed on September 17, 1787.',
      },
    ],
  },
  {
    id: 'bill-of-rights',
    title: 'Bill of Rights',
    subtitle: 'Ratified December 15, 1791',
    year: 1791,
    description: 'The first ten amendments to the Constitution, guaranteeing essential rights and liberties of individuals and limiting the power of the federal government.',
    sections: [
      {
        id: 'bor-1',
        title: 'First Amendment — Religion, Speech, Press, Assembly, Petition',
        text: 'Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.',
        plainEnglish: 'The government cannot establish an official religion, stop you from practicing yours, silence your speech, restrict the press, prevent peaceful protests, or stop you from petitioning the government to fix problems.',
      },
      {
        id: 'bor-2',
        title: 'Second Amendment — Right to Bear Arms',
        text: 'A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.',
        plainEnglish: 'Because a trained civilian defense force is important for a free country, the people\'s right to own and carry weapons cannot be violated.',
      },
      {
        id: 'bor-3',
        title: 'Third Amendment — Quartering of Soldiers',
        text: 'No Soldier shall, in time of peace be quartered in any house, without the consent of the Owner, nor in time of war, but in a manner to be prescribed by law.',
        plainEnglish: 'The government can\'t force you to house soldiers in your home during peacetime, and even during war it can only happen according to law.',
      },
      {
        id: 'bor-4',
        title: 'Fourth Amendment — Search and Seizure',
        text: 'The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized.',
        plainEnglish: 'The government can\'t search your body, home, documents, or belongings without good reason. To get a search warrant, they must swear they have probable cause and specify exactly what they\'re looking for and where.',
      },
      {
        id: 'bor-5',
        title: 'Fifth Amendment — Due Process, Self-Incrimination, Double Jeopardy',
        text: 'No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury, except in cases arising in the land or naval forces, or in the Militia, when in actual service in time of War or public danger; nor shall any person be subject for the same offence to be twice put in jeopardy of life or limb; nor shall be compelled in any criminal case to be a witness against himself, nor be deprived of life, liberty, or property, without due process of law; nor shall private property be taken for public use, without just compensation.',
        plainEnglish: 'You can\'t be tried for a serious crime without a grand jury indictment. You can\'t be tried twice for the same crime. You can\'t be forced to testify against yourself. The government can\'t take your life, freedom, or property without fair legal proceedings. If the government takes your property for public use, they must pay you fairly.',
      },
      {
        id: 'bor-6',
        title: 'Sixth Amendment — Right to a Fair Trial',
        text: 'In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury of the State and district wherein the crime shall have been committed, which district shall have been previously ascertained by law, and to be informed of the nature and cause of the accusation; to be confronted with the witnesses against him; to have compulsory process for obtaining witnesses in his favor, and to have the Assistance of Counsel for his defence.',
        plainEnglish: 'If you\'re charged with a crime, you have the right to a quick, public trial with an unbiased jury in the area where the crime happened. You must be told what you\'re charged with, face your accusers, bring witnesses in your defense, and have a lawyer.',
      },
      {
        id: 'bor-7',
        title: 'Seventh Amendment — Civil Trial Rights',
        text: 'In Suits at common law, where the value in controversy shall exceed twenty dollars, the right of trial by jury shall be preserved, and no fact tried by a jury, shall be otherwise re-examined in any Court of the United States, than according to the rules of the common law.',
        plainEnglish: 'In civil lawsuits (non-criminal disputes) over $20, you have the right to a jury trial. A higher court can\'t overturn a jury\'s factual findings.',
      },
      {
        id: 'bor-8',
        title: 'Eighth Amendment — Cruel and Unusual Punishment',
        text: 'Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.',
        plainEnglish: 'Bail can\'t be set unreasonably high, fines can\'t be excessive, and the government can\'t use cruel or unusual punishments.',
      },
      {
        id: 'bor-9',
        title: 'Ninth Amendment — Rights Retained by the People',
        text: 'The enumeration in the Constitution, of certain rights, shall not be construed to deny or disparage others retained by the people.',
        plainEnglish: 'Just because a right isn\'t specifically listed in the Constitution doesn\'t mean people don\'t have it. The listed rights aren\'t the only ones you have.',
      },
      {
        id: 'bor-10',
        title: 'Tenth Amendment — Powers Reserved to States and People',
        text: 'The powers not delegated to the United States by the Constitution, nor prohibited by it to the States, are reserved to the States respectively, or to the people.',
        plainEnglish: 'Any power not specifically given to the federal government by the Constitution belongs to the states or to the people.',
      },
    ],
  },
]
