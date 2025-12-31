export interface RoadmapStep {
    stepNumber: string;
    stepName: string;
    stepDetails: string;
    percentage: string;
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
                        name: "Alpha SG1A",
                        steps: [
                            { stepNumber: "SG1-01", stepName: "Intro", stepDetails: "Body Mechanics & Physics", percentage: "3%" },
                            { stepNumber: "SG1-02", stepName: "Stance", stepDetails: "Maintain Center of Gravity", percentage: "5%" },
                            { stepNumber: "SG1-03", stepName: "Direction", stepDetails: "Turning right and left", percentage: "8%" },
                            { stepNumber: "SG1-04", stepName: "Movement", stepDetails: "Basic footwork", percentage: "10%" },
                            { stepNumber: "SG1-05", stepName: "Guard", stepDetails: "Protecting the centerline", percentage: "12%" }
                        ]
                    },
                    {
                        level: 2,
                        name: "Beta S1B",
                        steps: [
                            { stepNumber: "SG2-01", stepName: "Advanced Stance", stepDetails: "Dynamic balance", percentage: "35%" },
                            { stepNumber: "SG2-02", stepName: "Striking", stepDetails: "Basic strikes", percentage: "45%" }
                        ]
                    },
                    {
                        level: 3,
                        name: "Omega SG1O",
                        steps: [
                            { stepNumber: "SG3-01", stepName: "Flow", stepDetails: "Continuous movement", percentage: "72%" },
                            { stepNumber: "SG3-02", stepName: "Mastery", stepDetails: "Full integration", percentage: "80%" }
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
