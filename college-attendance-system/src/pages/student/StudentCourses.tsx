import { useEffect, useState } from 'react';
import { BookOpen, User, Clock, MapPin, Play } from 'lucide-react';
import { getActiveCourseSession } from '../../services/api';
import { Course } from '../../types';

interface Props {
  courses: Course[];
  onEnableLocation: (courseId: number) => void;
}

export default function StudentCourses({ courses, onEnableLocation }: Props) {
  const [activeSessionCourseIds, setActiveSessionCourseIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadActiveSessions = async () => {
      const entries = await Promise.all(
        courses.map(async (course) => {
          try {
            const res = await getActiveCourseSession(course.id);
            return [course.id, Boolean(res.data?.id)] as const;
          } catch {
            return [course.id, false] as const;
          }
        })
      );
      setActiveSessionCourseIds(Object.fromEntries(entries));
    };

    if (courses.length > 0) {
      loadActiveSessions();
    } else {
      setActiveSessionCourseIds({});
    }
  }, [courses]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h1>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No courses enrolled yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <BookOpen size={18} className="text-indigo-600" />
                </div>
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                  {course.code}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{course.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{course.department}</p>

              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                {course.staffName && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User size={12} />
                    <span>{course.staffName}</span>
                  </div>
                )}
                {course.schedules?.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {course.schedules.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1">
                        <Clock size={11} className="shrink-0" />
                        <span className="font-semibold">Day {s.dayOrder}</span>
                        <span>{s.timeSlot}</span>
                        {s.venue && <><MapPin size={11} className="shrink-0" /><span>{s.venue}</span></>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  {activeSessionCourseIds[course.id] ? (
                    <>
                      <p className="text-xs font-semibold text-green-700">Attendance is live for this course.</p>
                      <button
                        onClick={() => onEnableLocation(course.id)}
                        className="mt-2 flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                      >
                        <Play size={12} /> Enable location for attendance
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">No live attendance session right now.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
