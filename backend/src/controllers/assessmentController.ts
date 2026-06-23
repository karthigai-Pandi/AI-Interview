import { Request, Response } from 'express';
import {
  Application,
  Interview,
  Question,
  Result,
  Job,
  Report,
  User,
} from '../models';
import { aiService } from '../services/ai';
import { executeCode, runTestCases } from '../services/piston';
import { createNotification } from '../services/notifications';
import {
  resolveJobId,
  fetchAptitudeQuestions,
  fetchTechnicalQuestions,
  formatQuestionsForClient,
} from '../utils/assessmentQuestions';

export const assessmentController = {
  async startAptitude(req: Request, res: Response): Promise<void> {
    const { applicationId, category, difficulty, questionCount } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      candidateId: req.user!._id,
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    const existing = await Interview.findOne({
      applicationId,
      candidateId: req.user!._id,
      type: 'aptitude',
      status: 'in_progress',
    });

    if (existing) {
      const questionIds = existing.questions.map((q) => q.questionId).filter(Boolean);
      const dbQuestions = await Question.find({ _id: { $in: questionIds } });
      const ordered = questionIds
        .map((id) => dbQuestions.find((q) => q._id.toString() === id))
        .filter((q): q is NonNullable<typeof q> => !!q);

      res.json({
        success: true,
        data: {
          sessionId: existing._id,
          timeLimitMinutes: existing.timeLimitMinutes,
          questions: formatQuestionsForClient(ordered),
        },
      });
      return;
    }

    let questions = await fetchAptitudeQuestions(category, difficulty, questionCount);

    if (questions.length < questionCount) {
      try {
        const generated = await aiService.generateQuestions({
          type: 'aptitude',
          category,
          difficulty,
          count: questionCount - questions.length,
        });

        for (const gq of generated) {
          const q = await Question.create({
            type: 'aptitude',
            category,
            difficulty,
            question: gq.question,
            options: gq.options,
            correctAnswer: gq.correct_answer,
            tags: ['ai-generated'],
            isActive: true,
          });
          questions.push(q);
        }
      } catch {
        // fallback questions already ensured by fetchAptitudeQuestions
      }
    }

    questions = questions.slice(0, questionCount);

    if (questions.length === 0) {
      res.status(400).json({ success: false, message: 'No aptitude questions available' });
      return;
    }

    const interview = await Interview.create({
      applicationId,
      candidateId: req.user!._id,
      jobId: resolveJobId(application.jobId),
      type: 'aptitude',
      status: 'in_progress',
      category,
      difficulty,
      timeLimitMinutes: questionCount * 2,
      startedAt: new Date(),
      questions: questions.map((q) => ({
        questionId: q._id.toString(),
        questionText: q.question,
      })),
    });

    application.status = 'assessment';
    application.currentStage = 'Aptitude Test In Progress';
    await application.save();

    res.json({
      success: true,
      data: {
        sessionId: interview._id,
        timeLimitMinutes: interview.timeLimitMinutes,
        questions: formatQuestionsForClient(questions),
      },
    });
  },

  async submitAptitude(req: Request, res: Response): Promise<void> {
    const interview = await Interview.findOne({
      _id: req.params.sessionId,
      candidateId: req.user!._id,
      type: 'aptitude',
    });

    if (!interview) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const { answers, antiCheatFlags } = req.body;
    let correctCount = 0;
    const evaluatedQuestions = [];

    for (const ans of answers) {
      const question = await Question.findById(ans.questionId);
      const isCorrect =
        question?.correctAnswer?.toLowerCase().trim() === ans.answer?.toLowerCase().trim();
      if (isCorrect) correctCount++;
      evaluatedQuestions.push({
        questionId: ans.questionId,
        questionText: question?.question || '',
        answer: ans.answer,
        score: isCorrect ? 10 : 0,
        timeSpent: ans.timeSpent,
        isCorrect,
      });
    }

    const score = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
    interview.questions = evaluatedQuestions;
    interview.score = score;
    interview.status = 'completed';
    interview.completedAt = new Date();
    if (antiCheatFlags) interview.antiCheatFlags = antiCheatFlags;
    await interview.save();

    const application = await Application.findById(interview.applicationId).populate('jobId');
    if (application) {
      application.currentStage = 'Aptitude Test Completed';
      await application.save();

      const jobData = application.jobId as unknown as {
        recruiterId: { toString(): string };
        title: string;
      };
      await createNotification(
        jobData.recruiterId.toString(),
        'assessment_completed',
        'Aptitude Test Completed',
        `A candidate completed the aptitude test for ${jobData.title} (Score: ${score}%)`,
        `/recruiter/reports/${application._id}`
      );
    }

    res.json({
      success: true,
      data: { score, correctCount, totalQuestions: answers.length, interview },
    });
  },

  async startTechnical(req: Request, res: Response): Promise<void> {
    const { applicationId, difficulty } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      candidateId: req.user!._id,
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    const existing = await Interview.findOne({
      applicationId,
      candidateId: req.user!._id,
      type: 'technical',
      status: 'in_progress',
    });

    if (existing) {
      const questionIds = existing.questions.map((q) => q.questionId).filter(Boolean);
      const dbQuestions = await Question.find({ _id: { $in: questionIds } });
      const ordered = questionIds
        .map((id) => dbQuestions.find((q) => q._id.toString() === id))
        .filter((q): q is NonNullable<typeof q> => !!q);

      res.json({
        success: true,
        data: {
          sessionId: existing._id,
          timeLimitMinutes: existing.timeLimitMinutes,
          questions: formatQuestionsForClient(ordered),
        },
      });
      return;
    }

    const allQuestions = await fetchTechnicalQuestions(difficulty);

    if (allQuestions.length === 0) {
      res.status(400).json({ success: false, message: 'No technical questions available' });
      return;
    }

    const interview = await Interview.create({
      applicationId,
      candidateId: req.user!._id,
      jobId: resolveJobId(application.jobId),
      type: 'technical',
      status: 'in_progress',
      difficulty,
      timeLimitMinutes: 60,
      startedAt: new Date(),
      questions: allQuestions.map((q) => ({
        questionId: q._id.toString(),
        questionText: q.question,
      })),
    });

    application.status = 'assessment';
    application.currentStage = 'Technical Assessment In Progress';
    await application.save();

    res.json({
      success: true,
      data: {
        sessionId: interview._id,
        timeLimitMinutes: 60,
        questions: formatQuestionsForClient(allQuestions),
      },
    });
  },

  async runCode(req: Request, res: Response): Promise<void> {
    const { language, code, stdin } = req.body;

    try {
      const result = await executeCode(language, code, stdin || '');
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Code execution failed',
      });
    }
  },

  async submitTechnical(req: Request, res: Response): Promise<void> {
    const interview = await Interview.findOne({
      _id: req.params.sessionId,
      candidateId: req.user!._id,
      type: 'technical',
    });

    if (!interview) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const { answers, antiCheatFlags } = req.body;
    let totalScore = 0;
    const evaluatedQuestions = [];

    for (const ans of answers) {
      const question = await Question.findById(ans.questionId);
      let score = 0;
      let isCorrect = false;

      if (question?.type === 'mcq') {
        isCorrect =
          question.correctAnswer?.toLowerCase().trim() === ans.answer?.toLowerCase().trim();
        score = isCorrect ? 10 : 0;
      } else if (question && ans.code && question.testCases) {
        const results = await runTestCases(
          question.language || 'python',
          ans.code,
          question.testCases
        );
        const passed = results.filter((r) => r.passed).length;
        score = Math.round((passed / results.length) * 100);
        isCorrect = passed === results.length;
      }

      totalScore += score;
      evaluatedQuestions.push({
        questionId: ans.questionId,
        questionText: question?.question || '',
        answer: ans.answer,
        code: ans.code,
        score,
        timeSpent: ans.timeSpent,
        isCorrect,
      });
    }

    const avgScore = answers.length > 0 ? Math.round(totalScore / answers.length) : 0;
    interview.questions = evaluatedQuestions;
    interview.score = avgScore;
    interview.status = 'completed';
    interview.completedAt = new Date();
    if (antiCheatFlags) interview.antiCheatFlags = antiCheatFlags;
    await interview.save();

    const application = await Application.findById(interview.applicationId).populate('jobId');
    if (application) {
      application.currentStage = 'Technical Assessment Completed';
      application.status = 'interview';
      await application.save();

      const jobData = application.jobId as unknown as {
        recruiterId: { toString(): string };
        title: string;
      };
      await createNotification(
        jobData.recruiterId.toString(),
        'assessment_completed',
        'Technical Test Completed',
        `A candidate completed the technical assessment for ${jobData.title} (Score: ${avgScore}%)`,
        `/recruiter/reports/${application._id}`
      );
    }

    res.json({
      success: true,
      data: { score: avgScore, interview },
    });
  },

  async analyzeProctoring(req: Request, res: Response): Promise<void> {
    const { image_base64 } = req.body;
    try {
      const result = await aiService.analyzeProctoring(image_base64);
      res.json({ success: true, data: result });
    } catch {
      res.json({
        success: true,
        data: { engagement_score: 75, attention_level: 'medium', face_detected: false },
      });
    }
  },
};

export const interviewController = {
  async startAiInterview(req: Request, res: Response): Promise<void> {
    const { applicationId } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      candidateId: req.user!._id,
    }).populate('jobId');

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    const existing = await Interview.findOne({
      applicationId,
      candidateId: req.user!._id,
      type: 'ai_hr',
      status: 'in_progress',
    });

    if (existing) {
      const lastInterviewer = [...existing.conversation]
        .reverse()
        .find((c) => c.role === 'interviewer');

      res.json({
        success: true,
        data: {
          interviewId: existing._id,
          question: lastInterviewer?.content || 'Welcome back. Please continue your answer.',
          questionNumber: existing.conversation.filter((c) => c.role === 'interviewer').length,
          timeLimitMinutes: existing.timeLimitMinutes || 30,
        },
      });
      return;
    }

    const job = application.jobId as unknown as {
      title: string;
      description: string;
      companyInfo?: { name: string };
    };

    const interview = await Interview.create({
      applicationId,
      candidateId: req.user!._id,
      jobId: resolveJobId(application.jobId),
      type: 'ai_hr',
      status: 'in_progress',
      startedAt: new Date(),
      timeLimitMinutes: 30,
      conversation: [],
    });

    const firstQuestion = await aiService.getNextInterviewQuestion({
      conversation: [],
      job_description: job.description,
      company_name: job.companyInfo?.name || 'the company',
      interview_type: 'mixed',
      question_count: 0,
    });

    interview.conversation.push({
      role: 'interviewer',
      content: firstQuestion.question,
      timestamp: new Date(),
    });
    await interview.save();

    application.status = 'interview';
    application.currentStage = 'AI Interview In Progress';
    await application.save();

    res.json({
      success: true,
      data: {
        interviewId: interview._id,
        question: firstQuestion.question,
        questionNumber: firstQuestion.question_number,
        timeLimitMinutes: 30,
      },
    });
  },

  async sendMessage(req: Request, res: Response): Promise<void> {
    const interview = await Interview.findOne({
      _id: req.params.id,
      candidateId: req.user!._id,
      type: 'ai_hr',
      status: 'in_progress',
    }).populate('jobId');

    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found' });
      return;
    }

    const { message } = req.body;
    interview.conversation.push({
      role: 'candidate',
      content: message,
      timestamp: new Date(),
    });

    const job = interview.jobId as unknown as {
      description?: string;
      companyInfo?: { name: string };
    };

    const nextQ = await aiService.getNextInterviewQuestion({
      conversation: interview.conversation.map((c) => ({
        role: c.role,
        content: c.content,
      })),
      job_description: job?.description,
      company_name: job?.companyInfo?.name,
      interview_type: 'mixed',
      question_count: interview.conversation.filter((c) => c.role === 'interviewer').length,
    });

    const isComplete = Boolean(
      (nextQ as { is_complete?: boolean; isComplete?: boolean }).is_complete ??
        (nextQ as { isComplete?: boolean }).isComplete
    );

    if (!isComplete && nextQ.question) {
      interview.conversation.push({
        role: 'interviewer',
        content: nextQ.question,
        timestamp: new Date(),
      });
    } else if (isComplete) {
      interview.status = 'completed';
      interview.completedAt = new Date();
    }

    await interview.save();

    res.json({
      success: true,
      data: {
        question: isComplete ? null : nextQ.question,
        isComplete,
        questionNumber: nextQ.question_number,
        conversation: interview.conversation,
      },
    });
  },

  async getNextQuestion(req: Request, res: Response): Promise<void> {
    const interview = await Interview.findOne({
      _id: req.params.id,
      candidateId: req.user!._id,
    });

    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found' });
      return;
    }

    const lastInterviewer = [...interview.conversation]
      .reverse()
      .find((c) => c.role === 'interviewer');

    res.json({
      success: true,
      data: {
        question: lastInterviewer?.content,
        conversation: interview.conversation,
        status: interview.status,
      },
    });
  },

  async completeInterview(req: Request, res: Response): Promise<void> {
    const interview = await Interview.findOne({
      _id: req.params.id,
      candidateId: req.user!._id,
      type: 'ai_hr',
    }).populate('jobId');

    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found' });
      return;
    }

    const job = interview.jobId as unknown as { description?: string };

    const evaluation = await aiService.evaluateInterview({
      conversation: interview.conversation.map((c) => ({
        role: c.role,
        content: c.content,
      })),
      job_description: job?.description,
      interview_type: 'mixed',
    });

    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.score = evaluation.overall_score;
    await interview.save();

    const result = await Result.create({
      interviewId: interview._id,
      applicationId: interview.applicationId,
      candidateId: req.user!._id,
      sectionScores: {
        technical: evaluation.section_scores.technical,
        communication: evaluation.section_scores.communication,
        problemSolving: evaluation.section_scores.problem_solving,
        aptitude: 0,
        confidence: evaluation.section_scores.confidence,
        grammar: evaluation.section_scores.grammar,
        fluency: evaluation.section_scores.fluency,
        relevance: evaluation.section_scores.relevance,
      },
      overallScore: evaluation.overall_score,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      suggestions: evaluation.suggestions,
      recruiterSummary: evaluation.recruiter_summary,
    });

    const application = await Application.findById(interview.applicationId).populate('jobId');
    if (application) {
      application.currentStage = 'AI Interview Completed';
      await application.save();

      const jobData = application.jobId as unknown as {
        recruiterId: { toString(): string };
        title: string;
      };
      await createNotification(
        jobData.recruiterId.toString(),
        'interview_completed',
        'Interview Completed',
        `A candidate completed the AI interview for ${jobData.title}`,
        `/recruiter/reports/${application._id}`
      );
    }

    res.json({
      success: true,
      data: { result, evaluation },
    });
  },

  async updateAntiCheat(req: Request, res: Response): Promise<void> {
    const { tabSwitches, pasteEvents, fullscreenExits } = req.body;

    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, candidateId: req.user!._id },
      {
        $inc: {
          'antiCheatFlags.tabSwitches': tabSwitches || 0,
          'antiCheatFlags.pasteEvents': pasteEvents || 0,
          'antiCheatFlags.fullscreenExits': fullscreenExits || 0,
        },
      },
      { new: true }
    );

    res.json({ success: true, data: interview?.antiCheatFlags });
  },
};

export const aiController = {
  async analyzeResume(req: Request, res: Response): Promise<void> {
    const { resumeUrl, jobId } = req.body;
    const user = await User.findById(req.user!._id);

    const url = resumeUrl || user?.profile?.resumeUrl;
    if (!url) {
      res.status(400).json({ success: false, message: 'No resume found' });
      return;
    }

    let jobDescription: string | undefined;
    let jobSkills: string[] | undefined;

    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        jobDescription = job.description;
        jobSkills = job.skills;
      }
    }

    const analysis = await aiService.analyzeResume({
      resume_url: url,
      job_description: jobDescription,
      job_skills: jobSkills,
    });

    const report = await Report.create({
      type: 'resume_analysis',
      candidateId: req.user!._id,
      jobId: jobId || undefined,
      data: {
        skills: analysis.skills,
        atsScore: analysis.ats_score,
        jobMatchScore: analysis.job_match_score,
        matchedSkills: analysis.matched_skills,
        missingSkills: analysis.missing_skills,
        improvements: analysis.improvements,
        recruiterSummary: analysis.recruiter_summary,
        extractedText: analysis.extracted_text,
        experienceYears: analysis.experience_years,
      },
    });

    if (jobId) {
      await Application.findOneAndUpdate(
        { candidateId: req.user!._id, jobId },
        { resumeAnalysisId: report._id, status: 'screening', currentStage: 'Resume Analyzed' }
      );
    }

    res.json({ success: true, data: { report, analysis } });
  },

  async getReport(req: Request, res: Response): Promise<void> {
    const report = await Report.findOne({
      _id: req.params.id,
      candidateId: req.user!._id,
    });

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    res.json({ success: true, data: report });
  },
};
