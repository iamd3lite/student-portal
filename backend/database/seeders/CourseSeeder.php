<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Department;
use App\Models\Semester;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    /**
     * Per-department course titles for each semester (7 each), mirroring
     * the frontend catalogue. Codes are generated from the department code,
     * the level and an odd/even sequence per semester.
     */
    private array $catalog = [
        'CSC' => [
            'sem1' => ['Data Structures & Algorithms', 'Operating Systems', 'Database Systems', 'Computer Architecture', 'Discrete Mathematics', 'Systems Programming', 'Object-Oriented Programming'],
            'sem2' => ['Software Engineering', 'Computer Networks', 'Artificial Intelligence', 'Web Application Development', 'Compiler Construction', 'Mobile Application Development', 'Human-Computer Interaction'],
        ],
        'EEE' => [
            'sem1' => ['Circuit Theory', 'Electromagnetic Fields', 'Digital Electronics', 'Signals & Systems', 'Electrical Machines I', 'Engineering Mathematics III', 'Measurements & Instrumentation'],
            'sem2' => ['Control Systems', 'Power Systems Analysis', 'Microprocessors', 'Communication Systems', 'Electrical Machines II', 'Analogue Electronics', 'Power Electronics'],
        ],
        'MEE' => [
            'sem1' => ['Thermodynamics I', 'Fluid Mechanics I', 'Strength of Materials', 'Engineering Drawing', 'Dynamics of Machines', 'Materials Science', 'Engineering Mathematics III'],
            'sem2' => ['Thermodynamics II', 'Fluid Mechanics II', 'Machine Design', 'Heat Transfer', 'Manufacturing Technology', 'Mechanical Vibrations', 'Applied Mechanics'],
        ],
        'MAC' => [
            'sem1' => ['News Writing & Reporting', 'Media Law & Ethics', 'Broadcast Production', 'Photojournalism', 'History of Nigerian Media', 'Communication Theories', 'Graphics of Communication'],
            'sem2' => ['Public Relations', 'Advertising Principles', 'Development Communication', 'Media Management', 'Investigative Journalism', 'Online & Multimedia Journalism', 'Film Studies'],
        ],
        'ACC' => [
            'sem1' => ['Financial Accounting', 'Cost Accounting', 'Business Law', 'Quantitative Techniques', 'Principles of Auditing', 'Company Law', 'Microeconomics'],
            'sem2' => ['Management Accounting', 'Taxation', 'Corporate Reporting', 'Public Sector Accounting', 'Accounting Information Systems', 'Financial Management', 'Auditing & Assurance'],
        ],
        'ECO' => [
            'sem1' => ['Microeconomics I', 'Macroeconomics I', 'Statistics for Economists', 'History of Economic Thought', 'Mathematical Economics', 'Structure of the Nigerian Economy', 'Public Finance'],
            'sem2' => ['Microeconomics II', 'Macroeconomics II', 'Econometrics', 'Development Economics', 'International Economics', 'Monetary Economics', 'Labour Economics'],
        ],
        'LAW' => [
            'sem1' => ['Constitutional Law', 'Law of Contract', 'Criminal Law', 'Nigerian Legal System', 'Law of Torts', 'Legal Methods', 'Legal Research & Writing'],
            'sem2' => ['Commercial Law', 'Equity & Trusts', 'Jurisprudence', 'Company Law', 'Land Law', 'Law of Evidence', 'Administrative Law'],
        ],
        'MCB' => [
            'sem1' => ['General Microbiology', 'Bacteriology', 'Microbial Physiology', 'Mycology', 'Cell Biology', 'Biostatistics', 'Analytical Biochemistry'],
            'sem2' => ['Virology', 'Immunology', 'Food Microbiology', 'Medical Microbiology', 'Microbial Genetics', 'Industrial Microbiology', 'Environmental Microbiology'],
        ],
        'BCH' => [
            'sem1' => ['General Biochemistry', 'Enzymology', 'Carbohydrate Metabolism', 'Analytical Methods', 'Cell Biology', 'Bioorganic Chemistry', 'Biostatistics'],
            'sem2' => ['Lipid & Protein Metabolism', 'Molecular Biology', 'Clinical Biochemistry', 'Membrane Biochemistry', 'Nutritional Biochemistry', 'Immunochemistry', 'Pharmacological Biochemistry'],
        ],
        'MED' => [
            'sem1' => ['Human Anatomy I', 'Physiology I', 'Medical Biochemistry I', 'Histology', 'Embryology', 'Medical Ethics', 'Biostatistics'],
            'sem2' => ['Human Anatomy II', 'Physiology II', 'Pathology', 'Pharmacology', 'Microbiology & Immunology', 'Community Medicine', 'Clinical Skills'],
        ],
    ];

    private array $units = [3, 3, 2, 3, 2, 3, 2];

    private array $levels = [100, 200, 300, 400];

    public function run(): void
    {
        $sem1 = Semester::where('term', 1)->first();
        $sem2 = Semester::where('term', 2)->first();

        foreach (Department::all() as $department) {
            $titles = $this->catalog[$department->code] ?? null;
            if (! $titles) {
                continue;
            }

            foreach ($this->levels as $level) {
                $prefix = (int) ($level / 100); // 3 for 300

                $this->makeCourses($department, $sem1, $level, $prefix, $titles['sem1'], odd: true);
                $this->makeCourses($department, $sem2, $level, $prefix, $titles['sem2'], odd: false);
            }
        }
    }

    private function makeCourses(Department $department, ?Semester $semester, int $level, int $prefix, array $titles, bool $odd): void
    {
        if (! $semester) {
            return;
        }

        foreach ($titles as $i => $title) {
            // sem1 => 01,03,05..., sem2 => 02,04,06...
            $num = $odd ? ($i * 2 + 1) : ($i * 2 + 2);
            $code = sprintf('%s %d%02d', $department->code, $prefix, $num);
            $prevNum = $num > 1 ? $num - 1 : 1;
            $prereq = $prefix > 1 ? sprintf('%s %d%02d', $department->code, $prefix - 1, $prevNum) : null;

            Course::updateOrCreate(
                ['code' => $code, 'semester_id' => $semester->id],
                [
                    'title' => $title,
                    'unit' => $this->units[$i] ?? 3,
                    'department_id' => $department->id,
                    'level' => $level,
                    'prerequisite' => $prereq,
                    'capacity' => 120,
                ],
            );
        }
    }
}
