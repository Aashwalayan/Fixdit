const OfficialApplication = require('../models/OfficialApplication.cjs');
const User = require('../models/User.cjs');
const Notification = require('../models/Notification.cjs');

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const requireAdmin = (req, res) => {
  if (!req.user || normalizeRole(req.user.role) !== 'admin') {
    res.status(403).json({ error: 'Only the active administrator can review official applications.' });
    return false;
  }
  return true;
};

const submitApplication = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    if (normalizeRole(req.user.role) !== 'user') {
      return res.status(400).json({ error: 'Only citizen accounts can apply to become official.' });
    }

    const { fullName, department, designation, employeeId, governmentEmail, proofDocument } = req.body;

    if (!fullName || !department || !designation || !employeeId || !proofDocument) {
      return res.status(400).json({ error: 'Please complete every required application field.' });
    }

    const existingApplication = await OfficialApplication.findOne({ applicant: req.user._id });
    if (existingApplication && existingApplication.status === 'pending') {
      return res.status(400).json({ error: 'You already have a pending official application.' });
    }

    const application = await OfficialApplication.create({
      applicant: req.user._id,
      fullName,
      department,
      designation,
      employeeId,
      governmentEmail: governmentEmail || '',
      proofDocument,
      status: 'pending',
    });

    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map((admin) => Notification.create({
      recipient: admin._id,
      type: 'official_application',
      title: 'New official application',
      message: `${fullName} submitted an official application for ${department}.`,
      metadata: { applicationId: application._id },
    })));

    return res.status(201).json({
      message: 'Official application submitted successfully.',
      application,
    });
  } catch (error) {
    console.error(`Submit official application error: ${error.message}`);
    return res.status(500).json({ error: 'Could not submit official application.' });
  }
};

const getMyApplication = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const application = await OfficialApplication.findOne({ applicant: req.user._id });
    return res.status(200).json({ application });
  } catch (error) {
    console.error(`Get application error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load your application.' });
  }
};

const listPendingApplications = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const applications = await OfficialApplication.find({ status: 'pending' });
    return res.status(200).json({ applications });
  } catch (error) {
    console.error(`List applications error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load applications.' });
  }
};

const reviewApplication = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { status, rejectionReason } = req.body;
    const application = await OfficialApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'This application has already been reviewed.' });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Invalid review status.' });
    }

    if (status === 'rejected' && !String(rejectionReason || '').trim()) {
      return res.status(400).json({ error: 'Please provide a rejection reason.' });
    }

    const updatedApplication = await OfficialApplication.findByIdAndUpdate(
      application._id,
      {
        status,
        rejectionReason: status === 'rejected' ? String(rejectionReason).trim() : '',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (status === 'approved') {
      const applicant = await User.findById(application.applicant._id || application.applicant);
      if (!applicant) {
        return res.status(404).json({ error: 'Applicant account not found.' });
      }

      await User.findByIdAndUpdate(
        applicant._id,
        {
          role: 'official',
          displayName: application.fullName || applicant.displayName || applicant.username,
          department: application.department,
          designation: application.designation,
        },
        { new: true },
        { allowAdminRole: false }
      );

      await Notification.create({
        recipient: applicant._id,
        type: 'official_application',
        title: 'Official application approved',
        message: 'Your application was approved. Your account is now an official account.',
        metadata: { applicationId: application._id },
      });
    } else {
      const applicantId = application.applicant._id || application.applicant;
      await Notification.create({
        recipient: applicantId,
        type: 'official_application',
        title: 'Official application rejected',
        message: rejectionReason || 'Your application was rejected by the administrator.',
        metadata: { applicationId: application._id },
      });
    }

    return res.status(200).json({
      message: status === 'approved' ? 'Application approved.' : 'Application rejected.',
      application: updatedApplication,
    });
  } catch (error) {
    console.error(`Review application error: ${error.message}`);
    return res.status(500).json({ error: 'Could not review application.' });
  }
};

module.exports = {
  submitApplication,
  getMyApplication,
  listPendingApplications,
  reviewApplication,
};
