import React, { useState } from 'react'
import st from 'styles/pages/DocumentPage.module.sass'
import clsx from 'clsx'
import moment from 'moment'
import { useRequest } from 'hooks/request.hook'
import { useParams } from 'react-router'
import { archiveDocument, getDocument, getPDF, rejectDocument, resolveDocument } from 'store/document'
import { requestsStatus } from 'utils/requestsStatus'
import { Loading } from 'components/Loading'
import { Error } from 'components/Error'
import { Helmet } from 'react-helmet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarPlus, faCheck, faEdit, faFilePdf, faInfoCircle, faUser } from '@fortawesome/free-solid-svg-icons'
import { getUsers } from 'store/users'
import { useDispatchTyped } from 'hooks/dispatchTyped.hook'
import { saveAs } from 'file-saver'
import { useAuth } from 'hooks/auth.hook'
import { Modal } from 'components/Modal'
import { useForm } from 'hooks/form.hook'
import { Input } from 'components/input/Input'
import { Textarea } from 'components/input/Textarea'
import { validate } from 'utils/validate'
import { notify } from 'utils/notify'
import { formErrors } from 'utils/formErrors'
import { Form } from 'components/Form'
import { useTranslation } from 'react-i18next'

interface SignModalProps {
  close: () => void
}
const SignModal: React.FC<SignModalProps> = ({ close }) => {
  const { t } = useTranslation()
  const dispatch = useDispatchTyped()
  const [formData, update] = useForm({ password: '' })
  const [showErrors, setShowErrors] = useState(false)
  const validation = {
    password: validate(formData.password, ['required']),
  }
  const submit = () => {
    if (formErrors(validation).length) return setShowErrors(true)
    dispatch(resolveDocument(formData)).then(res => res.meta.requestStatus === 'fulfilled' && close())
  }
  return (
    <div className={st.signModal}>
      <Form onSubmit={submit}>
        <Input
          value={formData.password}
          autoComplete="new-password"
          label={t('password')}
          type="password"
          set={update('password')}
          {...validation.password}
          {...{ showErrors }}
        />
        <div className={clsx(st.submit, st.sign)} onClick={submit}>
        {t('document.sign')}
        </div>
      </Form>
    </div>
  )
}

interface RejectModalProps {
  close: () => void
}
const RejectModal: React.FC<RejectModalProps> = ({ close }) => {
  const { t } = useTranslation()
  const dispatch = useDispatchTyped()
  const [formData, update] = useForm({ rejectReason: '', password: '' })
  const [showErrors, setShowErrors] = useState(false)
  const validation = {
    password: validate(formData.password, ['required']),
    rejectReason: validate(formData.rejectReason, ['required']),
  }
  const submit = () => {
    if (formErrors(validation).length) return setShowErrors(true)
    dispatch(rejectDocument(formData)).then(res => res.meta.requestStatus === 'fulfilled' && close())
  }
  return (
    <div className={st.rejectModal}>
      <Form onSubmit={submit}>
        <Input
          value={formData.password}
          autoComplete="new-password"
          label={t('password')}
          type="password"
          set={update('password')}
          {...validation.password}
          {...{ showErrors }}
        />
        <Textarea
          value={formData.rejectReason}
          label={t('reason')}
          set={update('rejectReason')}
          {...validation.rejectReason}
          {...{ showErrors }}
        />
        <div className={clsx(st.submit, st.reject)} onClick={submit}>
          {t('document.reject')}
        </div>
      </Form>
    </div>
  )
}

export const DocumentPage: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatchTyped()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false)
  const [doc, documentStatus, documentError] = useRequest(
    s => s.document,
    () => getDocument({ id })
  )
  const [users, usersStatus, usersError] = useRequest(
    s => s.users,
    () => getUsers()
  )
  const status = requestsStatus(documentStatus, usersStatus)
  const pdf = async () => {
    const res = await dispatch(getPDF())
    res.meta.requestStatus === 'fulfilled'
      ? saveAs(new Blob([(res.payload as { file: BlobPart }).file], { type: 'application/pdf' }), doc?.title)
      : notify.error({ content: (res as any).error.message })
  }
  const currentSigner = doc?.signers.find(
    (s, i, signers) => s.status === 'WAITING' && !signers.slice(0, i).some(s => s.status === 'WAITING')
  )
  const archive = () => dispatch(archiveDocument())
  return (
    <>
      <Helmet>
        <title>{doc?.title || id} - Docs</title>
      </Helmet>
      {status === 'done' && doc && users && (
        <div className={st.container}>
          <div className={st.document}>
            <div className={st.head}>
              <span className={st.title}>{doc.title}</span>
              <div className={st.pdf} onClick={pdf}>
                <FontAwesomeIcon className={st.icon} icon={faFilePdf} />
                PDF
              </div>
            </div>
            <div className={st.content}>
              <div className={st.inner} id="content" dangerouslySetInnerHTML={{ __html: doc.rawDocument }} />
            </div>
          </div>
          <div className={st.side}>
            <div className={st.scrollable}>
              <div className={st.container}>
                <div className={st.docstatus}>
                  <span>
                    <FontAwesomeIcon className={st.icon} icon={faUser} size="sm" />
                    {users.find(u => u.userId === doc.userId)?.username}
                  </span>
                  <span>
                    <FontAwesomeIcon className={st.icon} icon={faInfoCircle} />
                    {t('document.status', { returnObjects: true })[doc.status]}
                  </span>
                  <span>
                    <FontAwesomeIcon className={st.icon} icon={faCalendarPlus} size="sm" />
                    {moment(doc.createdAt).format('YYYY-MM-DD HH:mm')}
                  </span>
                  {!!doc.updatedAt && (
                    <span>
                      <FontAwesomeIcon className={st.icon} icon={faEdit} size="sm" />
                      {moment(doc.updatedAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                  )}
                </div>
                <div className={st.signers}>
                  <div className={st.label}>{t('document.signers')}</div>
                  <div className={st.inner}>
                    {doc.signers.map(s => (
                      <div
                        className={clsx(st.signer, st[s.status], { [st.current]: s === currentSigner })}
                        key={s.userId}>
                        <div className={st.username}>{users.find(u => u.userId === s.userId)?.username}</div>
                        <div className={st.d}>
                          <span>{t('signer.status', { returnObjects: true })[s.status]}</span>
                          {!!s.updatedAt && <span>{moment(s.updatedAt).format('YYYY-MM-DD HH:mm')}</span>}
                        </div>
                        {s.status === 'REJECTED' && (
                          <div className={st.rejectReason}>{s.rejectReason}</div>
                        )}
                        {s.status === 'RESOLVED' && <FontAwesomeIcon className={st.resolved} icon={faCheck} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className={st.buttons}>
              {currentSigner?.userId === user?.userId && (
                <>
                  <div className={st.sign} onClick={() => setIsSignModalOpen(true)}>
                    {t('document.sign')}
                  </div>
                  <div className={st.reject} onClick={() => setIsRejectModalOpen(true)}>
                    {t('document.reject')}
                  </div>
                </>
              )}
              {doc.userId === user?.userId &&
                doc.signers.every(s => s.status !== 'WAITING') &&
                doc.status !== 'ARCHIVED' && (
                  <div className={st.archive} onClick={archive}>
                    {t('document.archive')}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
      {status === 'loading' && <Loading />}
      {status === 'error' && <Error msg={[documentError, usersError]} />}
      <Modal isOpen={isSignModalOpen} close={() => setIsSignModalOpen(false)}>
        <SignModal close={() => setIsSignModalOpen(false)} />
      </Modal>
      <Modal isOpen={isRejectModalOpen} close={() => setIsRejectModalOpen(false)}>
        <RejectModal close={() => setIsRejectModalOpen(false)} />
      </Modal>
    </>
  )
}
