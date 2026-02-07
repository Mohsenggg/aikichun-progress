export interface RoadmapStep {
    stepNumber: string;
    stepName: string;
    stepDetails: string;
    percentage: string;
}

export interface DbRoadmapStep {
    id?: number; // Optional if you have an ID column
    stepName: string;
    stepNumber: string;
    stepDetails: string;
    spercentages: string; // The user used 'spercentages'
    levelName: string;
    levelNumber: number;
    sectionName: string;
    sectionNumber: number;
    gradeName: string;
    gradeNumber: number;
}

export interface RoadmapLevel {
    level: number;
    name: string;
    steps: RoadmapStep[];
}

export interface RoadmapSection {
    section: number;
    "section-name": string;
    levels: RoadmapLevel[];
}

export interface RoadmapGrade {
    grade: number;
    "grade-name": string;
    sections: RoadmapSection[];
}




export const ROADMAP_DATA: RoadmapGrade[] = [
    {
        grade: 1,
        "grade-name": "PROTECTOR",
        sections: [
            {
                section: 1,
                "section-name": "Striker",
                levels: [
                    {
                        level: 1,
                        name: "Omega SG1O",
                        steps: [
                            {
                                stepNumber: "SG1-01", stepName: "فهم الأساسيات ", stepDetails: ".1فهم الفلسفة و الخطة\n2 فهم المشاكل و المميزات الحركيه واستخدام الفيزياء.3 فهم الأسلحة السبعة ونقاط اللأستهداف . 4فهم اللأ ستراتيجيات التكتيكية بأستخدام البيئة والمحيط. 5فهم اهداف القتال اللأربعه والتغيير بينهم. 6 فهم مركز الثقل بشكل عملى.    ", percentage: "% 2"
                            },
                            { stepNumber: "SG1-02", stepName: "تعلم الوقوف مع الحفاظ على مركز الثقل الجسم ", stepDetails: "", percentage: "3%" },
                            { stepNumber: "SG1-03", stepName: "تعلم التوجه يمين وشمال على مشط الرجل وكعب الرجل", stepDetails: "", percentage: "5%" },
                            { stepNumber: "SG1-04", stepName: "تعلم حماية خط المنتصف", stepDetails: "", percentage: "6%" },
                            { stepNumber: "SG1-05", stepName: "تعلم الأنفجار مع فصل اليد عن الجسم ", stepDetails: "", percentage: "8%" },
                            { stepNumber: "SG1-06", stepName: "تعلم امتصاص الضغط وملء الفراغ مزدوج وفردى", stepDetails: "", percentage: "10%" },

                            { stepNumber: "SG1-07", stepName: "تعلم تبديل اليد وحماية الوجه في وضع الباك ساو في التبادل بين الضربات", stepDetails: "", percentage: "11%" },
                            { stepNumber: "SG1-08", stepName: "تعلم تبديل اليد وحماية- الوجه في وضع الشون شوى في التبادل بين الضربات ", stepDetails: "", percentage: "13%" },
                            { stepNumber: "SG1-09", stepName: "تعلم رفع الرجل مع الثبات على القدم الخلفية", stepDetails: "", percentage: "14%" },
                            { stepNumber: "SG1-010", stepName: "بداية تعلم دريل الباك ساو و الشون شوي ايد وايد", stepDetails: "", percentage: "16%" },
                            { stepNumber: "SG1-011", stepName: "تعلم تنفيذ الضربات الشون شوي", stepDetails: "خروج القوة من الكوع وتنفيذها على زميل التدريب وعلى السيند باك اليد الأمامى والخلفى بالتدريج", percentage: "17%" },
                            { stepNumber: "SG1-012", stepName: "تعلم دريل شن شوي وباك ساو ايد وايد ", stepDetails: "", percentage: "19%" },
                            { stepNumber: "SG1-013", stepName: "تعلم تبديل الدريل شن شوي وباك ساو ايد وايد ", stepDetails: "", percentage: "21%" },
                            { stepNumber: "SG1-014", stepName: "تعلم التحرك أمام يمين وأمام شمال مع دريل الخروج في رأس المثلث الأقدام مع الخصم ", stepDetails: "", percentage: "22%" },
                            { stepNumber: "SG1-015", stepName: "تعلم ا التحرك أثناء تبديل الدريل شن شوي وباك ساو ايد وايد ", stepDetails: "", percentage: "24%" },
                            { stepNumber: "SG1-016", stepName: "تعلم دريل الوصول الأ هداف من خط المنتصف زاويه ", stepDetails: "5 - بدون عائق- مع عائق – وضع الهجوم ووضع الدفاع – والوصول لل7أهداف", percentage: "25 % " },
                            { stepNumber: "SG1-017", stepName: "تعلم دريل التحرك من منتصف يمين وشمال ثم العودة للمنتصف ", stepDetails: "", percentage: "27%" },
                            { stepNumber: "SG1-018", stepName: "تعلم الحروج يمين وشمال مع محاولة الوصول وتوجيه ضربه وإزالة العائق ", stepDetails: "", percentage: "29%" },
                            { stepNumber: "SG1-019", stepName: "تعلم التان ساو من المنتصف ومع التحرك يمين و شمال  ", stepDetails: "", percentage: "30%" },
                            { stepNumber: "SG1-020", stepName: "تعلم دفاع التان ساو وكيفية استخدامه  ", stepDetails: "", percentage: "32%" },
                            { stepNumber: "SG1-021", stepName: " تعلم دريل الضربات في ثلاث اتجاهات   ", stepDetails: "اأثناء الدريل الباك ساو والشون شوي مع محاولة الوصول دفاع و هجوم", percentage: "33%" },
                            { stepNumber: "SG1-022", stepName: "تعلم  إزالة العائق الباك ساو والخروج من ناحية الباك ساو  ", stepDetails: "", percentage: "35%" },
                            { stepNumber: "SG1-023", stepName: "تعلم دريل الحروج في زاويه ال 45 درجة  ", stepDetails: "من ناحية الشون شوي ومن ناحية الباك ساو مع تسديد الضرباتوالتدرج في الدريل مرحلة مرحلة إلى أن يصل إلى التناغم والثلاثة والسرعة و القوة كالتالي:", percentage: "37%" },
                            { stepNumber: "SG1-023-A", stepName: "زاوية الصفر ", stepDetails: " ", percentage: "38%" },
                            { stepNumber: "SG1-023-B", stepName: " حروج من الشون شوي زاوية 45", stepDetails: " ", percentage: "40%" },
                            { stepNumber: "SG1-023-C", stepName: "التبديل وخروج شون شوي الجهة لأخرى", stepDetails: " ", percentage: "41%" },
                            { stepNumber: "SG1-023-D", stepName: "الخروج من إزالة العائق والصد تان ساو والرجوع لزاوية الصفر", stepDetails: " ", percentage: "43%" },
                            { stepNumber: "SG1-023-E", stepName: "الخروج يمين وشمال مع الهجوم من طرف واحد و الأخر دفاع بشكل منظم", stepDetails: " ", percentage: "%" },
                            { stepNumber: "SG1-023-F", stepName: "الخروج بشكل عشوائى من طرف واحد ", stepDetails: " ", percentage: "%" },
                            { stepNumber: "SG1-023-G", stepName: "الخروج والهجوم من أى طرف دفاع وهجوم بشكل عشوائى", stepDetails: " ", percentage: "%" },
                            { stepNumber: "SG1-023-H", stepName: "بداية أستخدام الرجل أثناء الخروج", stepDetails: " ", percentage: "%" },
                            { stepNumber: "SG1-023-I", stepName: "بداية التحرك و التقدم وكسب أرض أثناء الهجوم", stepDetails: " ", percentage: "%" },
                            { stepNumber: "SG1-023-J", stepName: "", stepDetails: " ", percentage: "%" },
                            { stepNumber: "SG1-023-K", stepName: "تعلم تقنيات السيطرة:", stepDetails: " ", percentage: "%" },
                            { stepNumber: "SG1-024", stepName: "كوتي جاشي", stepDetails: " ", percentage: "38%" },
                            { stepNumber: "SG1-25", stepName: "أريمي ناجي", stepDetails: " ", percentage: "40%" },
                            { stepNumber: "SG1-26", stepName: "نيك شوك", stepDetails: " ", percentage: "41%" },
                            { stepNumber: "SG1-27", stepName: "تعلم الدمج بين تقنيات السيطرة وتقنيات الأسترايك", stepDetails: " ", percentage: "43%" }


                        ]

                    },
                    {
                        level: 2,
                        name: "Beta SG1B",
                        steps: [
                            { stepNumber: "SG1-B28", stepName: "تعلم الجنح ساو", stepDetails: "", percentage: "44%" },
                            { stepNumber: "SG1-B29", stepName: "أستخدامها في الدريل", stepDetails: "", percentage: "46%" },
                            { stepNumber: "SG1-B30", stepName: "تعلم البونج ساو", stepDetails: "", percentage: "48%" },
                            { stepNumber: "SG1-B31", stepName: "أستخدامها في الدريل", stepDetails: "", percentage: "49%" },
                            { stepNumber: "SG1-B32", stepName: "تعلم الأب ساو", stepDetails: "", percentage: "51%" },
                            { stepNumber: "SG1-B33", stepName: "أستخدامها في الدريل ", stepDetails: "", percentage: "52%" },
                            { stepNumber: "SG1-B34", stepName: "تعلم الباك دا ", stepDetails: "", percentage: "54%" },
                            { stepNumber: "SG1-B35", stepName: "أستخدامها في الدريل ", stepDetails: "", percentage: "56%" },
                            { stepNumber: "SG1-B36", stepName: "تعلم التان دا ", stepDetails: "", percentage: "57%" },
                            { stepNumber: "SG1-B37", stepName: " أستخدامها في الدريل ", stepDetails: "", percentage: "59%" },
                            { stepNumber: "SG1-B38", stepName: " اودى جارميه ", stepDetails: "", percentage: "60%" },
                            { stepNumber: "SG1-B39", stepName: " أستخدامها في الدريل ", stepDetails: "", percentage: "62%" },
                            { stepNumber: "SG1-B40", stepName: " اودى جايشى ", stepDetails: "", percentage: "63%" },
                            { stepNumber: "SG1-B41", stepName: " أستخدامها في الدريل ", stepDetails: "", percentage: "65%" },
                            { stepNumber: "SG1-B42", stepName: "اودى جايشي كنترول ", stepDetails: "", percentage: "67%" },
                            { stepNumber: "SG1-B43", stepName: " أستخدامها في الدريل ", stepDetails: "", percentage: "68%" },
                            { stepNumber: "SG1-B44", stepName: " كوكيوهو ", stepDetails: "", percentage: "70%" },
                            { stepNumber: "SG1-B45", stepName: " أستخدامها في الدريل ", stepDetails: "", percentage: "71%" },
                            { stepNumber: "SG1-B46", stepName: " شيهو ناجي ", stepDetails: "", percentage: "73%" },
                            { stepNumber: "SG1-B47", stepName: " أستخدامها في الدريل ", stepDetails: "", percentage: "75%" },


                        ]
                    },
                    {
                        level: 3,
                        name: "Alpha SG1A",
                        steps: [
                            { stepNumber: "SG1-A48", stepName: "بداية مراحلة الألفا", stepDetails: "", percentage: "76%" },
                            { stepNumber: " SG1-A49", stepName: "استخدامها فى الدريل ", stepDetails: "", percentage: "78%" },
                            { stepNumber: " SG1-A50", stepName: "تعلم الهيد لوك", stepDetails: "", percentage: "79%" },
                            { stepNumber: " SG1-A51", stepName: "استخدامها فى الدريل ", stepDetails: "", percentage: "81%" },
                            { stepNumber: " SG1-A52", stepName: "تعلم اللأن ساو ", stepDetails: "", percentage: "83%" },
                            { stepNumber: " SG1-A53", stepName: "استخدامها فى الدريل ", stepDetails: "", percentage: "84%" },
                            { stepNumber: " SG1-A54", stepName: "تعلم الجت ساو ", stepDetails: "", percentage: "86%" },
                            { stepNumber: " SG1-A55", stepName: "استخدامها فى الدريل ", stepDetails: "", percentage: "87%" },

                            { stepNumber: " SG1-A56", stepName: "تعلم الخين ساو  ", stepDetails: "", percentage: "89%" },
                            { stepNumber: " SG1-A57", stepName: "استخدامها فى الدريل ", stepDetails: "", percentage: "90%" },
                            { stepNumber: " SG1-A58", stepName: "تعلم الشي ساو ", stepDetails: "", percentage: "92%" },
                            { stepNumber: " SG1-A59", stepName: "استخدامها فى الدريل ", stepDetails: "", percentage: "94%" },
                            { stepNumber: " SG1-A60", stepName: "دخول- ماتشات سيناريوهات الشارع و الضربات العشوائية ", stepDetails: "", percentage: "95%" },
                            { stepNumber: " SG1-A61", stepName: "بداية دريلات حل المشاكل والتطبيق ", stepDetails: "", percentage: "97%" },
                            { stepNumber: " SG1-A62", stepName: "تدريبات الأدرينالين كنترول والضغط القتالي ", stepDetails: "", percentage: "98%" },
                            { stepNumber: " SG1-A63", stepName: "مرحلة الاختبارات و بالتوفيق ", stepDetails: "", percentage: "100%" }
                        ]
                    }
                ]
            },
            {
                section: 2,
                "section-name": "Grappler",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            },
            {
                section: 3,
                "section-name": "Bladesman",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            },
            {
                section: 4,
                "section-name": "Grounder",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            }
        ]
    },
    {
        grade: 2,
        "grade-name": "FIGHTER",
        sections: [
            {
                section: 1,
                "section-name": "Striker",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            },
            {
                section: 2,
                "section-name": "Grappler",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            },
            {
                section: 3,
                "section-name": "Bladesman",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            },
            {
                section: 4,
                "section-name": "Grounder",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            }
        ]
    },
    {
        grade: 3,
        "grade-name": "WARRIOR",
        sections: [
            {
                section: 1,
                "section-name": "Striker",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            },
            {
                section: 2,
                "section-name": "Grappler",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            },
            {
                section: 3,
                "section-name": "Bladesman",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            },
            {
                section: 4,
                "section-name": "Grounder",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            }
        ]
    },
    {
        grade: 4,
        "grade-name": "MASTER",
        sections: [
            {
                section: 1,
                "section-name": "Mastery",
                levels: [
                    {
                        level: 1,
                        name: "Alpha",
                        steps: []
                    },
                    {
                        level: 2,
                        name: "Beta",
                        steps: []
                    },
                    {
                        level: 3,
                        name: "Omega",
                        steps: []
                    }
                ]
            }
        ]
    }
];
