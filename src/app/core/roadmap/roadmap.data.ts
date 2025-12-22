export interface RoadmapStep {
    stepNumber: string;
    stepName: string;
    stepDetails: string;
    percentage: string;
}

export interface RoadmapLevel {
    level: number;
    name: string; // Added name for UI (e.g. "Alpha SG1A")
    steps: RoadmapStep[];
}

export const ROADMAP_DATA: RoadmapLevel[] = [
    {
        level: 1,
        name: "Alpha SG1A",
        steps: [
            { stepNumber: "SG1-01", stepName: "Intro", stepDetails: "Body Mechanics & Physics", percentage: "3%" },
            { stepNumber: "SG1-02", stepName: "Stance", stepDetails: "Maintain Enter of Gravity", percentage: "5%" },
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
];
